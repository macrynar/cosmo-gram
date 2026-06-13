#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Cosmogram · 5 grafik relacji (Cosmo Match) — po jednej na tier kompatybilności.
# Self-host w repo (CDN Higgsfielda może wygasnąć — DS §7).
#
# Użycie (z korzenia repo):
#   bash scripts/fetch-match-graphics.sh
#   git add public/assets/match && git commit -m "Dodaj grafiki relacji (Cosmo Match)"
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="public/assets/match"
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp"
mkdir -p "$DIR"
dl(){ echo "→ $2"; curl -fSL --retry 3 "$CDN/$1" -o "$DIR/$2"; }

dl "hf_20260613_123451_1f1fb056-8570-489b-9857-00a91d0b824e.png" "bond-90-splecione.png"     # 90–100 Splecione gwiazdy
dl "hf_20260613_123931_832f2f7c-364e-48d3-b12d-e7ef6ae31e19.png" "bond-75-przyciaganie.png"  # 75–89  Silne przyciąganie
dl "hf_20260613_123935_4406add3-cd37-4f4b-bad2-bc7d1f045227.png" "bond-60-rosnaca.png"       # 60–74  Rosnąca więź
dl "hf_20260613_123938_3891e468-254e-4156-a48a-5923fcbd2a0c.png" "bond-45-tarcie.png"        # 45–59  Nauka przez tarcie
dl "hf_20260613_123453_bba903c6-c990-4327-b5b1-eacc52916f37.png" "bond-0-rozne-nieba.png"    # 0–44   Dwa różne nieba

echo; echo "Gotowe → $DIR ($(ls -1 "$DIR"/bond-*.png | wc -l | tr -d ' ')/5)"
echo "Następnie: git add public/assets/match && git commit -m \"Dodaj grafiki relacji (Cosmo Match)\""
