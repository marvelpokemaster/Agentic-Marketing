#!/usr/bin/env bash
# Download placeholder images for test-fixtures clients.
# Uses picsum.photos (free, no API key). Re-run anytime to refresh assets.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS="$ROOT/assets"

mkdir -p "$ASSETS"

download() {
  local url="$1"
  local out="$2"
  if [[ -f "$out" ]]; then
    echo "  skip (exists): $(basename "$out")"
    return
  fi
  echo "  download: $(basename "$out")"
  curl -fsSL "$url" -o "$out"
}

echo "Downloading test assets into $ASSETS"
echo

# Shared pool — each client gets distinct seeds so images look different
download "https://picsum.photos/seed/nexresume-logo/400/400"   "$ASSETS/nexresume-logo.png"
download "https://picsum.photos/seed/nexresume-p1/1200/800"    "$ASSETS/nexresume-product-1.jpg"
download "https://picsum.photos/seed/nexresume-p2/1200/800"    "$ASSETS/nexresume-product-2.jpg"

download "https://picsum.photos/seed/glowroot-logo/400/400"    "$ASSETS/glowroot-logo.png"
download "https://picsum.photos/seed/glowroot-life/1080/1080"  "$ASSETS/glowroot-lifestyle.jpg"
download "https://picsum.photos/seed/glowroot-p1/1200/800"     "$ASSETS/glowroot-product-1.jpg"
download "https://picsum.photos/seed/glowroot-p2/1200/800"     "$ASSETS/glowroot-product-2.jpg"

download "https://picsum.photos/seed/ironpulse-logo/400/400"   "$ASSETS/ironpulse-logo.png"
download "https://picsum.photos/seed/ironpulse-life/1080/1080" "$ASSETS/ironpulse-lifestyle.jpg"

download "https://picsum.photos/seed/cloudnest-logo/400/400"   "$ASSETS/cloudnest-logo.png"
download "https://picsum.photos/seed/cloudnest-p1/1200/800"  "$ASSETS/cloudnest-product-1.jpg"

echo
echo "Done. $(find "$ASSETS" -type f | wc -l) files in assets/"
echo "Next: open http://localhost:3000/products/new and use a client from clients/*.json"
