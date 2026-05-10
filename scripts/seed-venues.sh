#!/usr/bin/env bash
# Seeds a demo OWNER account and a handful of venues via web-bff.
# Usage: bash scripts/seed-venues.sh [BFF_BASE_URL]
#   BFF_BASE_URL defaults to http://localhost:4000
set -euo pipefail

BFF="${1:-http://localhost:4000}"
OWNER_EMAIL="owner@gmail.com"
RENTER_EMAIL="renter@gmail.com"
PASSWORD="Geslo123"

json() {
  local key="$1"
  python3 -c "import sys, json; print(json.load(sys.stdin).get('$key', ''))"
}

register() {
  local email="$1" role="$2"
  echo "→ Registering $role $email (ignored if already exists)"
  curl -s -X POST "$BFF/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"$role\"}" > /dev/null || true
}

register "$OWNER_EMAIL"  "OWNER"
register "$RENTER_EMAIL" "RENTER"

echo "→ Logging in as $OWNER_EMAIL"
TOKEN=$(curl -s -X POST "$BFF/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" | json token)

if [ -z "$TOKEN" ]; then
  echo "Login failed — check that web-bff is reachable at $BFF"
  exit 1
fi

echo "→ Creating venues"
create() {
  local name="$1" location="$2" capacity="$3" price="$4" description="$5"
  local response
  response=$(curl -s -X POST "$BFF/venues" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$name\",\"location\":\"$location\",\"capacity\":$capacity,\"pricePerDay\":$price,\"description\":\"$description\"}")
  printf '%s' "$response" | python3 -c "import sys, json; v=json.load(sys.stdin); print('  created #' + str(v.get('id','?')) + ' — ' + v.get('name','(no name)'))" || echo "  (create failed)"
}

create "Castle Ballroom"       "Ljubljana" 200 850  "Grand hall in a restored 18th-century castle."
create "Rooftop Lounge"        "Ljubljana" 80  420  "Panoramic rooftop with bar, perfect for cocktail parties."
create "Seaside Beach Club"    "Piran"     150 600  "Beachfront venue with terrace and private stretch of sand."
create "Alpine Lodge"          "Bled"      60  380  "Cozy mountain lodge with fireplace and lake views."
create "Vineyard Estate"       "Maribor"   120 520  "Tuscan-style vineyard with outdoor ceremony area."
create "Industrial Loft"       "Ljubljana" 100 350  "Open-plan brick loft for launches, parties, shoots."
create "Countryside Barn"      "Kamnik"    250 450  "Rustic barn on a farm — rustic-chic weddings."
create "Modern Art Gallery"    "Ljubljana" 70  290  "White-walled gallery space with track lighting."

echo "→ Done"
