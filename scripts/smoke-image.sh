#!/usr/bin/env bash
# Checks a running instance: pages load, a server PDF is produced, AI is off.
# Usage: scripts/smoke-image.sh [base-url]
set -euo pipefail
base=${1:-http://localhost:8102}
client=0
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

for _ in $(seq 1 60); do
  curl -fs -o /dev/null "$base/" && break
  sleep 2
done
for path in / /builder /privasi; do
  curl -fsS -o /dev/null "$base$path" || fail "page $path"
done
# Fonts are served locally and must be in the image.
curl -fsS -o /dev/null "$base/fonts/inter-latin-wght-normal.woff2" || fail "font"

# Every template, with non-Latin text, so that Chromium and its fonts are exercised.
for template in classic modern minimal banner timeline compact editorial bold accent executive; do
  cat > "$work/cv.json" <<JSON
{"version":1,"templateId":"$template","theme":{"accent":"#2563eb","font":"Inter","fontSize":10.5},
"basics":{"name":"Uji Image","title":"Développeur 山田","summary":"Memeriksa PDF di dalam container."},
"experience":[],"education":[],"skills":[],"projects":[],"certificates":[],"languages":[],
"sectionOrder":["summary"],"hiddenSections":[]}
JSON
  status=$(curl -sS -m 90 -o "$work/cv.pdf" -w '%{http_code}' \
    -H 'Content-Type: application/json' -H "X-Forwarded-For: 10.0.0.$((++client))" \
    --data-binary "@$work/cv.json" "$base/api/export/pdf")
  [ "$status" = 200 ] || fail "PDF $template returned $status: $(head -c 200 "$work/cv.pdf")"
  [ "$(head -c 5 "$work/cv.pdf")" = "%PDF-" ] || fail "PDF $template is not a PDF"
  size=$(wc -c < "$work/cv.pdf")
  [ "$size" -gt 5000 ] || fail "PDF $template is suspiciously small ($size bytes)"
  echo "ok PDF $template ($size bytes)"
done

[ "$(curl -fsS "$base/api/ai/review")" = '{"enabled":false}' ] || fail "AI must be off without settings"
echo "All checks passed."
