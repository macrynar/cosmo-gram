#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Cosmogram · pobranie 12 portretów znaków zodiaku do repo (self-host).
#
# Po co: redesign Wielkiej Trójki używa public/assets/zodiac/sign-<znak>.png.
# Portrety są generowane w Higgsfield i serwowane z CDN, który MOŻE WYGASNĄĆ —
# dlatego pobieramy je raz i commitujemy do repo (zgodnie z DS §7: "po akceptacji
# asset self-host").
#
# Użycie (z korzenia repo):
#   bash scripts/fetch-zodiac-portraits.sh
#   git add public/assets/zodiac && git commit -m "Dodaj portrety znaków zodiaku"
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="${1:-public/assets/zodiac}"
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp"

mkdir -p "$DIR"

dl() {  # dl <źródło-cdn> <docelowa-nazwa>
  echo "→ $2"
  curl -fSL --retry 3 "$CDN/$1" -o "$DIR/$2"
}

dl "hf_20260612_203113_2a5ebee5-7494-4b0c-9747-8e9fdf983590.png" "sign-aries.png"
dl "hf_20260612_203127_8ee44864-5f50-4edc-8adf-28cd10fc0aa8.png" "sign-taurus.png"
dl "hf_20260612_203130_dc7818ab-0354-4e4d-89a8-7d3a516888b6.png" "sign-gemini.png"
dl "hf_20260612_203133_88b159f4-771f-4b8a-be07-6d369fb602d8.png" "sign-cancer.png"
dl "hf_20260612_203135_9bb395cd-4395-4540-8bd8-108da9104cde.png" "sign-leo.png"
dl "hf_20260612_203149_4c2942fd-68ac-4f86-bf14-40b942a656fb.png" "sign-virgo.png"
dl "hf_20260612_203152_641b30a6-3498-4c74-b6b4-34de8d67ceda.png" "sign-libra.png"
dl "hf_20260612_203155_3e74c744-13f9-4271-b6fe-ed46156c5da2.png" "sign-scorpio.png"
dl "hf_20260612_203157_74b184ad-a380-46da-b751-3437ff7aa853.png" "sign-sagittarius.png"
dl "hf_20260612_203210_6fe0a235-4da0-4d16-a6da-a6f9ecc1ef90.png" "sign-capricorn.png"
dl "hf_20260612_203213_cd197183-adea-43cc-aa31-d33b4798e97e.png" "sign-aquarius.png"
dl "hf_20260612_203215_a25eaa9d-ae34-463f-9475-583d2c78722e.png" "sign-pisces.png"

COUNT=$(ls -1 "$DIR"/sign-*.png 2>/dev/null | wc -l | tr -d ' ')
echo
echo "Gotowe → $DIR ($COUNT/12 plików)"
if [ "$COUNT" != "12" ]; then
  echo "UWAGA: pobrano $COUNT z 12 — CDN mógł wygasnąć. Zgłoś, zregeneruję brakujące w Higgsfield."
  exit 1
fi
echo "Następnie:  git add public/assets/zodiac && git commit -m \"Dodaj portrety znaków zodiaku\""
