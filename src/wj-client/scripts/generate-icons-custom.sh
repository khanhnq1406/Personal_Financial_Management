#!/bin/bash

# Custom PWA Icon Generator with Background Options
# Generates icons with different background styles
#
# Usage: ./scripts/generate-icons-custom.sh [transparent|solid|rounded]
#   transparent - Transparent background (default)
#   solid       - Solid green background
#   rounded     - Rounded corners with solid background

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

INPUT_SVG="public/logo.svg"
OUTPUT_DIR="public/icons"
BRAND_COLOR="#008148"

# Icon sizes
SIZES=(72 96 128 144 152 192 384 512)
APPLE_ICON_SIZE=180

# Get background style from argument (default: transparent)
BG_STYLE="${1:-transparent}"

echo -e "${BLUE}🎨 Custom PWA Icon Generator${NC}"
echo -e "${BLUE}Background style: ${BG_STYLE}${NC}\n"

# Check ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick not installed${NC}"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Generate icon function
generate_icon() {
    local size=$1
    local output=$2
    local density=$((size * 4))

    case "$BG_STYLE" in
        solid)
            # Solid background
            convert -size "${size}x${size}" xc:"$BRAND_COLOR" \
                    \( -background none -density "$density" "$INPUT_SVG" \
                       -resize "$((size * 70 / 100))x$((size * 70 / 100))" \) \
                    -gravity center -composite \
                    -quality 100 "$output"
            ;;
        rounded)
            # Rounded corners with solid background
            local radius=$((size / 8))
            convert -size "${size}x${size}" xc:none \
                    -draw "roundrectangle 0,0 $size,$size $radius,$radius" \
                    -fill "$BRAND_COLOR" -draw "roundrectangle 0,0 $size,$size $radius,$radius" \
                    \( -background none -density "$density" "$INPUT_SVG" \
                       -resize "$((size * 70 / 100))x$((size * 70 / 100))" \) \
                    -gravity center -composite \
                    -quality 100 "$output"
            ;;
        transparent|*)
            # Transparent background (default)
            convert -background none \
                    -density "$density" \
                    "$INPUT_SVG" \
                    -resize "${size}x${size}" \
                    -gravity center \
                    -extent "${size}x${size}" \
                    -quality 100 "$output"
            ;;
    esac
}

echo -e "${BLUE}Generating icons...${NC}\n"

# Generate all sizes
for size in "${SIZES[@]}"; do
    output="$OUTPUT_DIR/icon-${size}x${size}.png"
    generate_icon "$size" "$output"
    file_size=$(du -h "$output" | cut -f1)
    echo -e "${GREEN}✅ icon-${size}x${size}.png (${file_size})${NC}"
done

# Apple touch icon
generate_icon "$APPLE_ICON_SIZE" "$OUTPUT_DIR/apple-touch-icon.png"
echo -e "${GREEN}✅ apple-touch-icon.png${NC}"

# Favicons
generate_icon 32 "$OUTPUT_DIR/favicon-32x32.png"
generate_icon 16 "$OUTPUT_DIR/favicon-16x16.png"
echo -e "${GREEN}✅ favicons generated${NC}"

echo -e "\n${GREEN}🎉 Done!${NC}"
echo -e "${BLUE}📁 Icons: $OUTPUT_DIR${NC}\n"

echo -e "${YELLOW}💡 Try different styles:${NC}"
echo -e "   ./scripts/generate-icons-custom.sh transparent"
echo -e "   ./scripts/generate-icons-custom.sh solid"
echo -e "   ./scripts/generate-icons-custom.sh rounded"
