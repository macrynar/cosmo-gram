#!/usr/bin/env bash
# Cosmogram · landing v2 — pobranie assetów z CDN Higgsfield do repo.
# URUCHOM LOKALNIE PRZED WDROŻENIEM — linki CDN mogą wygasnąć!
# Użycie: bash assets-download.sh [katalog_docelowy]   (domyślnie ./assets)
set -euo pipefail
DIR="${1:-./assets}"
mkdir -p "$DIR"
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp"

dl(){ echo "→ $2"; curl -fSL "$CDN/$1" -o "$DIR/$2"; }

# Hero
dl "hf_20260612_154636_236c3112-235d-4636-a00e-966b9675765b.png" "bg-hero.png"          # wariant C (poster)
dl "hf_20260612_161255_bfe53151-4819-43b7-bc52-7823443e43b2.mp4" "bg-hero-loop.mp4"     # pętla 10 s 1080p

# S2 — tło pod kołem natalnym
dl "hf_20260612_194522_9d728c37-7e44-43cc-9110-11489cc60896.png" "wheel-backdrop.png"

# Ilustracje (zestaw "ryt złotą linią"; kotwica stylu = ill-kosmogram)
dl "hf_20260612_192538_3cd1d4f4-26c4-4fd0-b07a-6594dfd861d6.png" "ill-kosmogram.png"
dl "hf_20260612_192646_13f92641-85cb-4ec8-9b96-4a7b7a49e277.png" "ill-match.png"
dl "hf_20260612_192709_01001640-0d59-4f21-a1fc-dd96cbc3baee.png" "ill-kalendarz.png"
dl "hf_20260612_192732_dd1baa95-d897-4bba-96fd-c6ab807486ac.png" "ill-chat.png"
dl "hf_20260612_192735_69d2a62b-60af-4dfe-9688-ff8c2299eeea.png" "ill-chwila-narodzin.png"
dl "hf_20260612_192738_32100d86-b851-45d7-8f51-bdbf6e5b6743.png" "ill-sfera.png"
dl "hf_20260612_192741_acc04a96-acad-4188-8e9a-a4ab68b13e5f.png" "ill-pioro.png"

echo
echo "Gotowe → $DIR"
echo "Dalej (zalecane):"
echo "  1. PNG → WebP/AVIF (np. npx @squoosh/cli albo cwebp -q 82), ilustracje kart wystarczą w 800px."
echo "  2. MP4 → przekoduj do ~3-4 MB: ffmpeg -i bg-hero-loop.mp4 -an -vcodec libx264 -crf 26 -movflags +faststart bg-hero-loop-web.mp4"
echo "     (+ wariant webm: ffmpeg -i bg-hero-loop.mp4 -an -c:v libvpx-vp9 -crf 38 -b:v 0 bg-hero-loop-web.webm)"
echo "  3. Usuń ścieżkę audio jeśli jest (-an już to robi) — autoplay wymaga muted."
