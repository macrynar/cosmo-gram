#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Cosmogram · grafiki Cosmo Prognozy (koło roku + 4 nastroje pogody).
# Self-host w repo (CDN Higgsfielda może wygasnąć — DS §7).
#
# Użycie (z korzenia repo):
#   bash scripts/fetch-prognoza-graphics.sh
#   git add public/assets/prognoza && git commit -m "Dodaj grafiki Cosmo Prognozy"
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="public/assets/prognoza"
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp"
mkdir -p "$DIR"
dl(){ echo "→ $2"; curl -fSL --retry 3 "$CDN/$1" -o "$DIR/$2"; }

# Koło roku (medalion widoku „Rok")
dl "hf_20260613_133844_b3de8b49-253b-429f-9d5d-5e7897c991f7.jpeg" "year-wheel.png"

# 4 nastroje „pogody" (orb w karcie Pogody, dobierany wg charakteru okresu)
dl "hf_20260613_133847_4b5ca381-075c-4926-b594-df1933ac767d.jpeg" "mood-calm.png"      # spokojny / łagodny
dl "hf_20260613_133849_350dd41a-dc4e-4d15-a1b2-ffe565026291.png"  "mood-intense.png"   # napięty
dl "hf_20260613_133853_3363c903-561a-45d9-aeb2-2ba405b62b0f.jpeg" "mood-electric.png"  # nieoczekiwany (Uran)
dl "hf_20260613_133855_df417677-3eb1-4c5f-8f38-497f2061a52e.jpeg" "mood-misty.png"     # mglisty / duchowy (Neptun)

echo; echo "Gotowe → $DIR ($(ls -1 "$DIR"/*.png | wc -l | tr -d ' ') plików)"
echo "Następnie: git add public/assets/prognoza && git commit -m \"Dodaj grafiki Cosmo Prognozy\""
