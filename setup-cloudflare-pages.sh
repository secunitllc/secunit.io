#!/usr/bin/env bash
# setup-cloudflare-pages.sh
#
# Creates the Cloudflare Pages project linked to Secunit-Mercantile/secunit.io.
# Requires CLOUDFLARE_API_KEY or CLOUDFLARE_TOKEN to be exported in the current shell.
# For Global API Key auth, also export CLOUDFLARE_EMAIL, e.g.:
#   export CLOUDFLARE_API_KEY="your_global_api_key"
#   export CLOUDFLARE_EMAIL="you@example.com"
#   bash setup-cloudflare-pages.sh
#
# Prerequisites:
#   - The Cloudflare Pages GitHub App must be installed on the Secunit-Mercantile GitHub org.
#     Install once at: https://github.com/apps/cloudflare-workers-and-pages
#   - jq must be installed (brew install jq)
#   - CLOUDFLARE_API_KEY or CLOUDFLARE_TOKEN must be either:
#       1) an API token with Pages:Edit + DNS:Edit, or
#       2) a Global API Key (with CLOUDFLARE_EMAIL set).

set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
GITHUB_OWNER="Secunit-Mercantile"
GITHUB_REPO="secunit.io"
PAGES_PROJECT="secunit-io"
PRODUCTION_BRANCH="main"
ZONE="secunit.io"
APEX_DOMAIN="secunit.io"
WWW_DOMAIN="www.secunit.io"
BUILD_CMD="bun run build"
OUTPUT_DIR="dist/client"

# ── Validate token ──────────────────────────────────────────────────────────
CLOUDFLARE_AUTH_VALUE="${CLOUDFLARE_TOKEN:-${CLOUDFLARE_API_KEY:-}}"

if [[ -z "$CLOUDFLARE_AUTH_VALUE" ]]; then
  echo "✗ CLOUDFLARE_API_KEY or CLOUDFLARE_TOKEN is not set. Export one first:" >&2
  echo "    export CLOUDFLARE_API_KEY=\"your_api_key\"" >&2
  exit 1
fi

AUTH_ARGS=()

echo "▸ Verifying token …"
VERIFY=$(curl -sf \
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_VALUE" \
  "$CF_API/user/tokens/verify" 2>/dev/null || true)
if echo "$VERIFY" | grep -q '"status":"active"'; then
  echo "  ✓ Token is active"
  AUTH_ARGS=(-H "Authorization: Bearer $CLOUDFLARE_AUTH_VALUE")
else
  # Fall back to Global API Key auth.
  if [[ -z "${CLOUDFLARE_EMAIL:-}" ]]; then
    echo "✗ Token verify failed, and CLOUDFLARE_EMAIL is not set for Global API Key auth." >&2
    echo "  Export CLOUDFLARE_EMAIL and retry." >&2
    exit 1
  fi

  USER_CHECK=$(curl -sf \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
    -H "X-Auth-Key: $CLOUDFLARE_AUTH_VALUE" \
    "$CF_API/user" 2>/dev/null || true)
  if echo "$USER_CHECK" | grep -q '"success":true'; then
    echo "  ✓ Global API Key accepted"
    AUTH_ARGS=(-H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_AUTH_VALUE")
  else
    echo "✗ Token appears invalid. Check CLOUDFLARE_API_KEY or CLOUDFLARE_TOKEN." >&2
    exit 1
  fi
fi

# ── Resolve account ID ──────────────────────────────────────────────────────
echo "▸ Fetching Cloudflare account …"
ACCOUNTS=$(curl -sf "${AUTH_ARGS[@]}" "$CF_API/accounts")
ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.result[0].id')
ACCOUNT_NAME=$(echo "$ACCOUNTS" | jq -r '.result[0].name')

if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "null" ]]; then
  echo "✗ Could not resolve account ID. API response:" >&2
  echo "$ACCOUNTS" | jq . >&2
  exit 1
fi

echo "  ✓ Account: $ACCOUNT_NAME ($ACCOUNT_ID)"

# ── Create Pages project ─────────────────────────────────────────────────────
echo "▸ Creating Pages project '$PAGES_PROJECT' …"
CREATE_RESP=$(curl -sS -X POST \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  "$CF_API/accounts/$ACCOUNT_ID/pages/projects" \
  -d "{
    \"name\": \"$PAGES_PROJECT\",
    \"production_branch\": \"$PRODUCTION_BRANCH\",
    \"source\": {
      \"type\": \"github\",
      \"config\": {
        \"owner\": \"$GITHUB_OWNER\",
        \"repo_name\": \"$GITHUB_REPO\",
        \"production_branch\": \"$PRODUCTION_BRANCH\",
        \"pr_comments_enabled\": true,
        \"deployments_enabled\": true,
        \"production_deployments_enabled\": true,
        \"preview_deployment_setting\": \"none\"
      }
    },
    \"build_config\": {
      \"build_command\": \"$BUILD_CMD\",
      \"destination_dir\": \"$OUTPUT_DIR\",
      \"root_dir\": \"\"
    },
    \"deployment_configs\": {
      \"production\": {
        \"env_vars\": {
          \"NODE_VERSION\": { \"type\": \"plain_text\", \"value\": \"26\" },
          \"BUN_VERSION\": { \"type\": \"plain_text\", \"value\": \"1.3\" }
        }
      },
      \"preview\": {
        \"env_vars\": {
          \"NODE_VERSION\": { \"type\": \"plain_text\", \"value\": \"26\" },
          \"BUN_VERSION\": { \"type\": \"plain_text\", \"value\": \"1.3\" }
        }
      }
    }
  }")

CREATE_SUCCESS=$(echo "$CREATE_RESP" | jq -r '.success // false')

if [[ "$CREATE_SUCCESS" == "true" ]]; then
  PAGES_URL=$(echo "$CREATE_RESP" | jq -r '.result.subdomain')
  echo "  ✓ Pages project created"
  echo "  ✓ Preview URL: https://$PAGES_URL"
else
  # Project may already exist — check
  if echo "$CREATE_RESP" | grep -qi "already exists"; then
    echo "  ℹ Project '$PAGES_PROJECT' already exists, skipping creation"
    PAGES_URL=$(curl -sf "${AUTH_ARGS[@]}" \
      "$CF_API/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT" \
      | jq -r '.result.subdomain')
  else
    echo "✗ Pages project creation failed:" >&2
    echo "$CREATE_RESP" | jq . >&2
    exit 1
  fi
fi

PROJECT_CHECK=$(curl -sf "${AUTH_ARGS[@]}" \
  "$CF_API/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT")
PROJECT_SOURCE_TYPE=$(echo "$PROJECT_CHECK" | jq -r '.result.source.type // empty')
PROJECT_BUILD_COMMAND=$(echo "$PROJECT_CHECK" | jq -r '.result.build_config.build_command // empty')
PROJECT_NODE_VERSION=$(echo "$PROJECT_CHECK" | jq -r '.result.deployment_configs.production.env_vars.NODE_VERSION.value // empty')

if [[ "$PROJECT_SOURCE_TYPE" != "github" ]]; then
  echo "✗ Pages project '$PAGES_PROJECT' is not Git-linked (source.type=$PROJECT_SOURCE_TYPE)." >&2
  echo "  Delete any Direct Uploads project with this name and retry." >&2
  exit 1
fi

if [[ "$PROJECT_BUILD_COMMAND" != "$BUILD_CMD" || "$PROJECT_NODE_VERSION" != "26" ]]; then
  echo "✗ Pages project '$PAGES_PROJECT' was created but build settings are incomplete." >&2
  echo "$PROJECT_CHECK" | jq '{build_config: .result.build_config, production_env: .result.deployment_configs.production.env_vars}' >&2
  exit 1
fi

echo "  ✓ Git source: $GITHUB_OWNER/$GITHUB_REPO"
echo "  ✓ Build command: $PROJECT_BUILD_COMMAND"
echo "  ✓ NODE_VERSION: $PROJECT_NODE_VERSION"

# ── Find Zone for secunit.io ─────────────────────────────────────────────────
echo "▸ Looking up zone for $ZONE …"
ZONES=$(curl -sf "${AUTH_ARGS[@]}" "$CF_API/zones?name=$ZONE")
ZONE_ID=$(echo "$ZONES" | jq -r '.result[0].id')

if [[ -z "$ZONE_ID" || "$ZONE_ID" == "null" ]]; then
  echo "  ⚠ Zone '$ZONE' not found in this account."
  echo "    Add DNS records manually in your Cloudflare dashboard:"
  echo "    1. CNAME  @    → $PAGES_URL  (proxied)"
  echo "    2. CNAME  www  → $PAGES_URL  (proxied)"
else
  echo "  ✓ Zone ID: $ZONE_ID"

  # ── Apex CNAME (Cloudflare flattens CNAME-at-apex automatically) ────────────
  EXISTING_APEX=$(curl -sf "${AUTH_ARGS[@]}" \
    "$CF_API/zones/$ZONE_ID/dns_records?type=CNAME&name=$APEX_DOMAIN")
  EXISTING_APEX_ID=$(echo "$EXISTING_APEX" | jq -r '.result[0].id // empty')

  if [[ -n "$EXISTING_APEX_ID" ]]; then
    echo "  ℹ Apex CNAME already exists (id $EXISTING_APEX_ID), skipping"
  else
    echo "▸ Adding apex CNAME $APEX_DOMAIN → $PAGES_URL …"
    APEX_RESP=$(curl -sS -X POST \
      "${AUTH_ARGS[@]}" \
      -H "Content-Type: application/json" \
      "$CF_API/zones/$ZONE_ID/dns_records" \
      -d "{
        \"type\": \"CNAME\",
        \"name\": \"@\",
        \"content\": \"$PAGES_URL\",
        \"proxied\": true,
        \"ttl\": 1
      }")
    APEX_SUCCESS=$(echo "$APEX_RESP" | jq -r '.success // false')
    if [[ "$APEX_SUCCESS" == "true" ]]; then
      echo "  ✓ Apex CNAME created — $APEX_DOMAIN → $PAGES_URL"
    else
      echo "  ⚠ Apex CNAME creation failed (add manually):" >&2
      echo "$APEX_RESP" | jq . >&2
    fi
  fi

  # ── www CNAME ───────────────────────────────────────────────────────────────
  EXISTING_WWW=$(curl -sf "${AUTH_ARGS[@]}" \
    "$CF_API/zones/$ZONE_ID/dns_records?type=CNAME&name=$WWW_DOMAIN")
  EXISTING_WWW_ID=$(echo "$EXISTING_WWW" | jq -r '.result[0].id // empty')

  if [[ -n "$EXISTING_WWW_ID" ]]; then
    echo "  ℹ www CNAME already exists (id $EXISTING_WWW_ID), skipping"
  else
    echo "▸ Adding www CNAME $WWW_DOMAIN → $PAGES_URL …"
    WWW_RESP=$(curl -sS -X POST \
      "${AUTH_ARGS[@]}" \
      -H "Content-Type: application/json" \
      "$CF_API/zones/$ZONE_ID/dns_records" \
      -d "{
        \"type\": \"CNAME\",
        \"name\": \"www\",
        \"content\": \"$PAGES_URL\",
        \"proxied\": true,
        \"ttl\": 1
      }")
    WWW_SUCCESS=$(echo "$WWW_RESP" | jq -r '.success // false')
    if [[ "$WWW_SUCCESS" == "true" ]]; then
      echo "  ✓ www CNAME created — $WWW_DOMAIN → $PAGES_URL"
    else
      echo "  ⚠ www CNAME creation failed (add manually):" >&2
      echo "$WWW_RESP" | jq . >&2
    fi
  fi
fi

# ── Attach custom domains to Pages ──────────────────────────────────────────
for CUSTOM_DOMAIN in "$APEX_DOMAIN" "$WWW_DOMAIN"; do
  echo "▸ Attaching custom domain $CUSTOM_DOMAIN to Pages project …"
  CUSTOM_RESP=$(curl -sS -X POST \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    "$CF_API/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains" \
    -d "{\"name\": \"$CUSTOM_DOMAIN\"}")

  CUSTOM_SUCCESS=$(echo "$CUSTOM_RESP" | jq -r '.success // false')
  if [[ "$CUSTOM_SUCCESS" == "true" ]]; then
    echo "  ✓ Custom domain attached: https://$CUSTOM_DOMAIN"
  elif echo "$CUSTOM_RESP" | grep -qi "already"; then
    echo "  ℹ Custom domain already attached: $CUSTOM_DOMAIN"
  else
    echo "  ⚠ Custom domain attachment failed (may need manual step):"
    echo "$CUSTOM_RESP" | jq .
  fi
done

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  Setup complete                                          │"
echo "│                                                          │"
printf "│  Pages project : %-39s│\n" "$PAGES_PROJECT"
printf "│  Preview URL   : %-39s│\n" "https://$PAGES_URL"
printf "│  Apex domain   : %-39s│\n" "https://$APEX_DOMAIN"
printf "│  www domain    : %-39s│\n" "https://$WWW_DOMAIN"
echo "│                                                          │"
echo "│  Push to main to trigger your first Cloudflare build.   │"
echo "└─────────────────────────────────────────────────────────┘"
