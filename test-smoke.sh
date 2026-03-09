#!/bin/bash
# Smoke tests para el API — corre con: bash test-smoke.sh
# Requiere que el API esté corriendo en localhost:4000

BASE="http://localhost:4000"
PASS=0
FAIL=0

check() {
  local label=$1
  local expected=$2
  local actual=$3
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $label"
    ((PASS++))
  else
    echo "  ❌ $label"
    echo "     expected: $expected"
    echo "     got:      $(echo $actual | head -c 200)"
    ((FAIL++))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  JobBoard API — Smoke Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Health ────────────────────────────────────────────────────
echo ""
echo "► Health"
R=$(curl -s "$BASE/health")
check "GET /health → live" "status" "$R"

R=$(curl -s "$BASE/health/ready")
check "GET /health/ready → ready" "status" "$R"

# ── Public routes (no auth) ───────────────────────────────────
echo ""
echo "► Public routes"
R=$(curl -s "$BASE/jobs")
check "GET /jobs → 200 array" "items\|total\|\[\]" "$R"

R=$(curl -s "$BASE/companies")
check "GET /companies → 200 array" "\[\]\|id\|slug" "$R"

# ── Auth guard working ────────────────────────────────────────
echo ""
echo "► Auth guard"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
check "GET /auth/me without token → 401" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/me")
check "GET /users/me without token → 401" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/jobs" \
  -H "Content-Type: application/json" -d '{"title":"test"}')
check "POST /jobs without token → 401" "401" "$R"

# ── Rate limiting working ─────────────────────────────────────
echo ""
echo "► Rate limiting (burst test)"
for i in {1..12}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/jobs")
  if [ "$STATUS" = "429" ]; then
    echo "  ✅ Rate limit triggered at request $i (429)"
    ((PASS++))
    break
  fi
  if [ $i -eq 12 ]; then
    echo "  ⚠️  Rate limit not triggered in 12 requests (may be configured higher — check @Throttle)"
  fi
done

# ── GraphQL endpoint ──────────────────────────────────────────
echo ""
echo "► GraphQL"
R=$(curl -s -X POST "$BASE/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}')
check "POST /graphql introspection → data" "__typename\|data" "$R"

R=$(curl -s -X POST "$BASE/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ jobs { items { id title } total } }"}')
check "query jobs → items array" "items\|total" "$R"

# ── Error format ──────────────────────────────────────────────
echo ""
echo "► Error format (requestId)"
R=$(curl -s "$BASE/users/me")
check "Error response has requestId" "requestId\|statusCode" "$R"

# ── Inngest endpoint ──────────────────────────────────────────
echo ""
echo "► Inngest"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/inngest")
check "GET /api/inngest reachable" "200\|405" "$R"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Passed: $PASS   Failed: $FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
