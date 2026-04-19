#!/usr/bin/env bash
# End-to-end walkthrough of every web-bff and mobile-bff route.
# Designed as a presentation: each step prints the curl command, the HTTP
# status, and the pretty-printed JSON response.
#
# Prereqs:
#   - docker-compose up --build is running and all services are listening
#   - curl and jq installed on PATH
#
# Usage:
#   bash scripts/demo-bffs.sh           # happy path
#   DEMO_INCLUDE_FAILURES=1 bash ...    # also show error responses
#
# Output is also tee'd to scripts/demo-bffs.log.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/demo-bffs.log"
exec > >(tee "$LOG") 2>&1

WEB="${WEB_BFF_URL:-http://localhost:4000}"
MOBILE="${MOBILE_BFF_URL:-http://localhost:4001}"

# ----- pretty printing ------------------------------------------------------

BOLD=$'\033[1m'; CYAN=$'\033[36m'; YELLOW=$'\033[33m'
GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; RESET=$'\033[0m'
STEP=0
STATUS=""    # last HTTP status
BODY=""      # last response body

hr() { printf '%s\n' "===================================================================="; }
section() {
  echo
  echo "${BOLD}${CYAN}####################################################################${RESET}"
  echo "${BOLD}${CYAN}# $1${RESET}"
  echo "${BOLD}${CYAN}####################################################################${RESET}"
}

# call <label> <method> <url> [json-body] [bearer-token]
call() {
  local label=$1 method=$2 url=$3 body=${4:-} token=${5:-}
  STEP=$((STEP+1))
  echo
  hr
  echo "${BOLD}[$STEP] $label${RESET}"
  echo "${DIM}--------------------------------------------------------------------${RESET}"

  # Build a printable command for the audience
  local printcmd="curl -X $method '$url'"
  [[ -n $token ]] && printcmd+=" \\
       -H 'Authorization: Bearer \$TOKEN'"
  [[ -n $body  ]] && printcmd+=" \\
       -H 'Content-Type: application/json' \\
       -d '$body'"
  echo "${YELLOW}\$ $printcmd${RESET}"

  # Run the real request, splitting status from body
  local tmp
  tmp=$(mktemp)
  local args=(-sS -X "$method" -o "$tmp" -w '%{http_code}')
  [[ -n $token ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n $body  ]] && args+=(-H "Content-Type: application/json" -d "$body")
  STATUS=$(curl "${args[@]}" "$url" || echo "000")
  BODY=$(cat "$tmp")
  rm -f "$tmp"

  local color=$GREEN
  [[ $STATUS -ge 400 ]] && color=$RED
  echo "${color}HTTP $STATUS${RESET}"
  if [[ -n $BODY ]]; then
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
}

# require_status <expected>
require_status() {
  local expected=$1
  if [[ "$STATUS" != "$expected" ]]; then
    echo "${RED}EXPECTED HTTP $expected, GOT $STATUS — halting.${RESET}"
    exit 1
  fi
}

# capture <jq-expr> -> echoes value
capture() { echo "$BODY" | jq -r "$1"; }

# ----- preflight ------------------------------------------------------------

command -v curl >/dev/null || { echo "curl not found"; exit 1; }
command -v jq   >/dev/null || { echo "jq not found";   exit 1; }

# Date helpers (works on BSD/macOS and GNU/Linux)
plus_days() {
  local n=$1
  date -u -v+"${n}"d +%Y-%m-%d 2>/dev/null || date -u -d "+${n} days" +%Y-%m-%d
}
START_DATE=$(plus_days 30)
END_DATE=$(plus_days 32)
QUICK_DATE=$(plus_days 60)

# Unique suffix so the script is re-runnable
STAMP=$(date +%s)
OWNER_EMAIL="owner-$STAMP@demo.com"
RENTER_EMAIL="renter-$STAMP@demo.com"
MOBILE_RENTER_EMAIL="mobile-$STAMP@demo.com"
PASSWORD="password123"

section "Demo configuration"
cat <<EOF
  web-bff       : $WEB
  mobile-bff    : $MOBILE
  owner email   : $OWNER_EMAIL
  renter email  : $RENTER_EMAIL
  mobile email  : $MOBILE_RENTER_EMAIL
  start date    : $START_DATE
  end date      : $END_DATE
  quick date    : $QUICK_DATE
  log file      : $LOG
EOF

# ============================================================================
section "0. Preflight — health checks"
# ============================================================================

call "web-bff /health" GET "$WEB/health"
require_status 200

call "mobile-bff /health" GET "$MOBILE/health"
require_status 200

# ============================================================================
section "1. Auth (web-bff /auth → user-service)"
# ============================================================================

call "register OWNER" POST "$WEB/auth/register" \
  "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"OWNER\"}"
require_status 201
OWNER_ID=$(capture '.id')

call "register RENTER" POST "$WEB/auth/register" \
  "{\"email\":\"$RENTER_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"RENTER\"}"
require_status 201
RENTER_ID=$(capture '.id')

call "login OWNER" POST "$WEB/auth/login" \
  "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}"
require_status 200
OWNER_TOKEN=$(capture '.token')
echo "${DIM}captured OWNER_TOKEN (${#OWNER_TOKEN} chars)${RESET}"

call "login RENTER" POST "$WEB/auth/login" \
  "{\"email\":\"$RENTER_EMAIL\",\"password\":\"$PASSWORD\"}"
require_status 200
RENTER_TOKEN=$(capture '.token')
echo "${DIM}captured RENTER_TOKEN (${#RENTER_TOKEN} chars)${RESET}"

# ============================================================================
section "2. web-bff /users (gRPC fan-out to user-service)"
# ============================================================================

call "GET /users/me as renter" GET "$WEB/users/me" "" "$RENTER_TOKEN"
require_status 200

call "GET /users/:id as renter" GET "$WEB/users/$OWNER_ID" "" "$RENTER_TOKEN"
require_status 200

# ============================================================================
section "3. web-bff /venues (REST + gRPC + parallel aggregation)"
# ============================================================================

call "POST /venues as owner — create demo venue" POST "$WEB/venues" \
  "{\"name\":\"Demo Hall $STAMP\",\"description\":\"Bright loft in city center\",\"location\":\"Ljubljana\",\"capacity\":50,\"pricePerDay\":250}" \
  "$OWNER_TOKEN"
require_status 201
VENUE_ID=$(capture '.id')

call "GET /venues — public list" GET "$WEB/venues"
require_status 200

call "GET /venues with filters" GET "$WEB/venues?location=Ljubljana&minCapacity=10"
require_status 200

call "GET /venues/:id (gRPC + owner lookup)" GET "$WEB/venues/$VENUE_ID"
require_status 200

call "GET /venues/:id/details — PARALLEL FAN-OUT (owner + 7-day availability)" \
     GET "$WEB/venues/$VENUE_ID/details"
require_status 200

call "GET /venues/:id/availability" \
     GET "$WEB/venues/$VENUE_ID/availability?startDate=$START_DATE&endDate=$END_DATE"
require_status 200

call "PUT /venues/:id as owner — update price" PUT "$WEB/venues/$VENUE_ID" \
  "{\"name\":\"Demo Hall $STAMP\",\"description\":\"Updated description\",\"location\":\"Ljubljana\",\"capacity\":50,\"pricePerDay\":300}" \
  "$OWNER_TOKEN"
require_status 200

# ============================================================================
section "4. web-bff /reservations (proxied to reservation-service)"
# ============================================================================

call "POST /reservations as renter" POST "$WEB/reservations" \
  "{\"venueId\":$VENUE_ID,\"startDate\":\"$START_DATE\",\"endDate\":\"$END_DATE\"}" \
  "$RENTER_TOKEN"
require_status 201
RES_ID=$(capture '.id')

call "GET /reservations as renter" GET "$WEB/reservations" "" "$RENTER_TOKEN"
require_status 200

call "GET /reservations?renterId=$RENTER_ID" \
     GET "$WEB/reservations?renterId=$RENTER_ID" "" "$RENTER_TOKEN"
require_status 200

call "GET /reservations/:id" GET "$WEB/reservations/$RES_ID" "" "$RENTER_TOKEN"
require_status 200

call "PATCH /reservations/:id/confirm as owner" \
     PATCH "$WEB/reservations/$RES_ID/confirm" "" "$OWNER_TOKEN"
require_status 200

call "PATCH /reservations/:id/cancel as renter" \
     PATCH "$WEB/reservations/$RES_ID/cancel" "" "$RENTER_TOKEN"
require_status 200

# ============================================================================
section "5. mobile-bff /auth (trimmed responses, same user-service)"
# ============================================================================

call "POST /auth/register on mobile-bff (trimmed body)" POST "$MOBILE/auth/register" \
  "{\"email\":\"$MOBILE_RENTER_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"RENTER\"}"
require_status 201
MOBILE_USER_ID=$(capture '.id')

call "POST /auth/login on mobile-bff (trimmed body) — uses RENTER credentials" \
     POST "$MOBILE/auth/login" \
  "{\"email\":\"$RENTER_EMAIL\",\"password\":\"$PASSWORD\"}"
require_status 200
# Response is { token, user: { id, role } } — note: NO email field
MOBILE_TOKEN=$(capture '.token')

# ============================================================================
section "6. mobile-bff /venues (trimmed venue payloads)"
# ============================================================================

call "GET /venues on mobile-bff (only id, name, location, pricePerDay)" \
     GET "$MOBILE/venues"
require_status 200

call "GET /venues/:id on mobile-bff" GET "$MOBILE/venues/$VENUE_ID"
require_status 200

call "GET /venues/:id/availability on mobile-bff (AuthGuard)" \
     GET "$MOBILE/venues/$VENUE_ID/availability?startDate=$START_DATE&endDate=$END_DATE" \
     "" "$RENTER_TOKEN"
require_status 200

# ============================================================================
section "7. mobile-bff /reservations (trimmed list, no /confirm route)"
# ============================================================================

call "GET /reservations on mobile-bff (trimmed)" \
     GET "$MOBILE/reservations" "" "$RENTER_TOKEN"
require_status 200

# ============================================================================
section "8. mobile-bff /mobile aggregates"
# ============================================================================

call "GET /mobile/home — PARALLEL FAN-OUT (featured venues + my reservations)" \
     GET "$MOBILE/mobile/home" "" "$RENTER_TOKEN"
require_status 200

call "POST /mobile/quick-book — availability check + create in one BFF call" \
     POST "$MOBILE/mobile/quick-book" \
  "{\"venueId\":$VENUE_ID,\"date\":\"$QUICK_DATE\"}" \
  "$RENTER_TOKEN"
require_status 201
QUICK_RES_ID=$(capture '.reservationId')

# ============================================================================
section "9. Cleanup"
# ============================================================================

call "PATCH /reservations/$QUICK_RES_ID/cancel (mobile-bff, trimmed response)" \
     PATCH "$MOBILE/reservations/$QUICK_RES_ID/cancel" "" "$RENTER_TOKEN" || true

call "DELETE /venues/$VENUE_ID as owner" \
     DELETE "$WEB/venues/$VENUE_ID" "" "$OWNER_TOKEN" || true

# ============================================================================
if [[ "${DEMO_INCLUDE_FAILURES:-0}" == "1" ]]; then
section "10. Negative cases (DEMO_INCLUDE_FAILURES=1)"
# ============================================================================

call "register duplicate email -> 400" POST "$WEB/auth/register" \
  "{\"email\":\"$RENTER_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"RENTER\"}"

call "GET /users/me without token -> 401" GET "$WEB/users/me"

call "POST /mobile/quick-book missing venueId -> 400" \
     POST "$MOBILE/mobile/quick-book" "{\"date\":\"$QUICK_DATE\"}" "$RENTER_TOKEN"
fi

# ----------------------------------------------------------------------------
echo
hr
echo "${BOLD}${GREEN}DEMO COMPLETE — $STEP steps run.${RESET}"
echo "Full transcript: $LOG"
hr
