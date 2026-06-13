#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Cosmogram · grafika mgławicy „obecności Astrei" do strony Cosmo Chat.
# Self-host w repo (CDN Higgsfielda może wygasnąć — DS §7).
#
# Użycie (z korzenia repo):
#   bash scripts/fetch-astrea-nebula.sh
#   git add public/assets/chat && git commit -m "Dodaj grafikę mgławicy Astrei (chat)"
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="public/assets/chat"
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp"
mkdir -p "$DIR"

# Wybrane ujęcie (to z mockupu).
curl -fSL --retry 3 "$CDN/hf_20260613_100822_e13f161d-e91e-4013-8108-55e984c88266.jpeg" -o "$DIR/astrea-nebula.jpg"

# Alternatywne ujęcie (gdyby trzeba podmienić — odkomentuj):
# curl -fSL --retry 3 "$CDN/hf_20260613_100822_0320f65f-2db7-4aab-af8a-509af80cde79.jpeg" -o "$DIR/astrea-nebula-alt.jpg"

echo "Gotowe → $DIR/astrea-nebula.jpg"
echo "Zalecane: konwersja do webp →  cwebp -q 82 $DIR/astrea-nebula.jpg -o $DIR/astrea-nebula.webp"
echo "Następnie: git add public/assets/chat && git commit -m \"Dodaj grafikę mgławicy Astrei (chat)\""
