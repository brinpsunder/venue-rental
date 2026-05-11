#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Demo skripta za vzorec Circuit Breaker (Odklopnik).
#
# Pokaže celoten življenjski cikel breakerja na primeru web-bff → venue-service:
#   1. Začetno stanje: vsi breakerji CLOSED
#   2. Ustavi venue-service
#   3. Stresne /venues — opazuj prehod CLOSED → OPEN
#   4. Pokaži fast-fail (latenca pade z ~3 s na <50 ms)
#   5. Restartaj venue-service
#   6. Pokaži samodejno okrevanje OPEN → HALF_OPEN → CLOSED
#
# Uporabljam /venues (ne /reservations), ker NE potrebuje avtentikacije.
# To odstrani confounder z neveljavnimi tokeni in osredotoči demo na breaker.
#
# Predpogoj: docker-compose up --build, vsi servisi zagnani.
# ─────────────────────────────────────────────────────────────────────────

set -uo pipefail

BFF_URL="${BFF_URL:-http://localhost:4000}"
SERVICE="${SERVICE:-venue-service}"
ENDPOINT="${ENDPOINT:-/venues}"
BREAKER_NAME="${BREAKER_NAME:-venue.rest.list}"
RESET_TIMEOUT_S="${RESET_TIMEOUT_S:-12}"   # opossum resetTimeout=10s + buffer

# ─── pomožne funkcije ──────────────────────────────────────────────────────

c_reset='\033[0m'; c_dim='\033[2m'; c_bold='\033[1m'
c_red='\033[31m'; c_green='\033[32m'; c_yellow='\033[33m'; c_blue='\033[34m'; c_cyan='\033[36m'

section() { printf "\n${c_bold}${c_blue}━━━ %s ━━━${c_reset}\n" "$*"; }
step()    { printf "${c_cyan}▸${c_reset} %s\n" "$*"; }
info()    { printf "${c_dim}  %s${c_reset}\n" "$*"; }
ok()      { printf "${c_green}  ✓ %s${c_reset}\n" "$*"; }
warn()    { printf "${c_yellow}  ⚠ %s${c_reset}\n" "$*"; }
err()     { printf "${c_red}  ✗ %s${c_reset}\n" "$*"; }

# Pridobi stanje izbranega breakerja iz /admin/breakers.
breaker_state() {
  curl -fsS "$BFF_URL/admin/breakers" 2>/dev/null \
    | jq -r --arg n "$BREAKER_NAME" \
        '.breakers[] | select(.name == $n)
         | "\(.state)\t\(.stats.fires)\t\(.stats.successes)\t\(.stats.failures)\t\(.stats.timeouts)\t\(.stats.rejects)\t\(.stats.fallbacks)"'
}

print_breaker() {
  local prefix="${1:-stanje}"
  local row state fires successes failures timeouts rejects fallbacks
  row=$(breaker_state)
  if [[ -z "$row" ]]; then
    err "ne morem dobiti stanja breakerja '$BREAKER_NAME' (je BFF zagnan?)"
    return 1
  fi
  IFS=$'\t' read -r state fires successes failures timeouts rejects fallbacks <<<"$row"
  local color=$c_green
  case "$state" in
    open) color=$c_red ;;
    half-open) color=$c_yellow ;;
  esac
  printf "  ${c_bold}${color}[%s]${c_reset} state=%s fires=%s successes=%s failures=%s timeouts=%s rejects=%s fallbacks=%s\n" \
    "$prefix" "$state" "$fires" "$successes" "$failures" "$timeouts" "$rejects" "$fallbacks"
}

# Izpiše stanje VSEH breakerjev v sistemu — pokaže izolacijo: ko je en breaker
# OPEN, ostali še vedno delujejo neprizadeti.
print_all_breakers() {
  local title="${1:-Vsi breakerji}"
  printf "\n  ${c_bold}${c_dim}── %s ──${c_reset}\n" "$title"
  curl -fsS "$BFF_URL/admin/breakers" 2>/dev/null \
    | jq -r '.breakers[] | "\(.state)\t\(.name)\t\(.stats.fires)\t\(.stats.fallbacks)"' \
    | while IFS=$'\t' read -r state name fires fallbacks; do
        local color="$c_green" marker=" "
        case "$state" in
          open)      color="$c_red";    marker="●" ;;
          half-open) color="$c_yellow"; marker="◐" ;;
          closed)    color="$c_dim";    marker="○" ;;
        esac
        printf "    ${color}%s %-26s %-10s${c_reset}  fires=%-3s fallbacks=%-3s\n" \
          "$marker" "$name" "$state" "$fires" "$fallbacks"
      done
}

# Vrne trenutni timestamp v milisekundah. Robustno čez Linux (date +%s%N)
# in macOS (BSD date, brez %N — uporabimo python).
now_ms() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import time; print(int(time.time()*1000))'
  elif command -v gdate >/dev/null 2>&1; then
    echo $(( $(gdate +%s%N) / 1000000 ))
  else
    # zadnji fallback: sekundna granularnost
    echo $(( $(date +%s) * 1000 ))
  fi
}

# Pošlji eno zahtevo in izpiši samo HTTP status + latenco + ali je degradiran.
hit() {
  local n="$1"
  local start_ms end_ms ms body status degraded
  start_ms=$(now_ms)

  # -m timeout 10s, da se nikoli ne zatakne
  local response
  response=$(curl -m 10 -s -w '\n__STATUS__%{http_code}' "$BFF_URL$ENDPOINT" 2>/dev/null || echo $'\n__STATUS__000')

  end_ms=$(now_ms)
  ms=$(( end_ms - start_ms ))

  status="${response##*__STATUS__}"
  body="${response%$'\n'__STATUS__*}"
  degraded=$(echo "$body" | jq -r 'if type=="object" then (.degraded // false) else false end' 2>/dev/null || echo "?")

  local indicator color
  if [[ "$status" == "200" ]]; then
    indicator="OK"; color=$c_green
  elif [[ "$degraded" == "true" ]]; then
    indicator="DEGRADED (fallback)"; color=$c_yellow
  else
    indicator="FAIL"; color=$c_red
  fi

  printf "  klic %2s  ${color}%-22s${c_reset} HTTP %s  %5s ms\n" "$n" "$indicator" "$status" "$ms"
}

# ─── glavni potek ──────────────────────────────────────────────────────────

section "0. Predpogoji"
if ! curl -fsS "$BFF_URL/health" >/dev/null 2>&1; then
  err "$BFF_URL/health ne odgovarja — zaženi 'docker compose up --build'"
  exit 1
fi
ok "web-bff dosegljiv na $BFF_URL"

if ! command -v jq >/dev/null; then
  err "jq ni nameščen (brew install jq)"
  exit 1
fi
ok "jq nameščen"

section "1. Začetno stanje (vse CLOSED)"
step "Pošljem 3 uspešne klice na $ENDPOINT"
for i in 1 2 3; do hit "$i"; done
print_breaker "po uspehih"

section "2. Ustavim downstream: $SERVICE"
docker compose stop "$SERVICE" >/dev/null 2>&1 || { err "stop $SERVICE ni uspel"; exit 1; }
ok "$SERVICE ustavljen"
sleep 1

section "3. Stresne klici med izpadom"
step "Pošljem 8 zaporednih klicev — opazuj prehod CLOSED → OPEN"
info "Prvih nekaj klicev čaka ~3 s na timeout, nato breaker preide v OPEN in fast-faila."
for i in 1 2 3 4 5 6 7 8; do
  hit "$i"
  if [[ $i -eq 4 ]]; then
    print_breaker "po 4 klicih"
  fi
done
print_breaker "po vseh 8 klicih"

section "4. Dokaz fast-faila (ko je OPEN)"
step "Pošljem še 3 klice — vsi morajo biti pod 100 ms"
for i in 1 2 3; do hit "$i"; done
print_breaker "po fast-failih"

step "Snapshot vseh breakerjev med izpadom — opazuj IZOLACIJO"
info "Samo '$BREAKER_NAME' je OPEN. Vsi ostali breakerji so neprizadeti (CLOSED),"
info "kar pomeni da napaka enega downstream-a ne ohromi celotnega BFF-ja."
print_all_breakers "Stanje med izpadom $SERVICE"

section "5. Restartam $SERVICE"
docker compose start "$SERVICE" >/dev/null 2>&1 || { err "start $SERVICE ni uspel"; exit 1; }
ok "$SERVICE zagnan"
info "Čakam $RESET_TIMEOUT_S s, da breaker preide v HALF_OPEN in da servis postane ready"
sleep "$RESET_TIMEOUT_S"

section "6. Samodejno okrevanje (HALF_OPEN → CLOSED)"
step "Pošljem 5 klicev — prvi sproži half-open testni klic, nato CLOSED"
for i in 1 2 3 4 5; do hit "$i"; sleep 0.3; done
print_breaker "po okrevanju"

section "✓ Demo končan"
print_all_breakers "Končno stanje (vsi CLOSED)"
