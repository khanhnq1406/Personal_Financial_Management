#!/bin/bash

# PWA Icon Generator using rsvg-convert (Better SVG rendering)
# This tool handles SVG strokes better than ImageMagick
#
# Prerequisites: librsvg
# Install on macOS: brew install librsvg
# Install on Ubuntu: sudo apt-get install librsvg2-bin
#
# Usage: ./scripts/generate-icons-rsvg.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

INPUT_SVG="public/logo.svg"
OUTPUT_DIR="public/icons"

SIZES=(72 96 128 144 152 192 384 512)
APPLE_ICON_SIZE=180

echo -e "${BLUE}🎨 PWA Icon Generator (rsvg-convert)${NC}\n"

# Check for rsvg-convert
if ! command -v rsvg-convert &> /dev/null; then
    echo -e "${RED}❌ rsvg-convert is not installed${NC}"
    echo -e "${BLUE}Install it with:${NC}"
    echo "  macOS: brew install librsvg"
    echo "  Ubuntu: sudo apt-get install librsvg2-bin"
    echo ""
    echo -e "${YELLOW}💡 Tip: rsvg-convert handles SVG strokes much better than ImageMagick${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}Generating icons with rsvg-convert...${NC}\n"

# Generate icons
for size in "${SIZES[@]}"; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}.png"

    rsvg-convert \
        --width="$size" \
        --height="$size" \
        --format=png \
        --keep-aspect-ratio \
        --output="$output_file" \
        "$INPUT_SVG"

    file_size=$(du -h "$output_file" | cut -f1)
    echo -e "${GREEN}✅ icon-${size}x${size}.png (${file_size})${NC}"
done

# Apple touch icon
rsvg-convert \
    --width="$APPLE_ICON_SIZE" \
    --height="$APPLE_ICON_SIZE" \
    --format=png \
    --keep-aspect-ratio \
    --output="$OUTPUT_DIR/apple-touch-icon.png" \
    "$INPUT_SVG"
echo -e "${GREEN}✅ apple-touch-icon.png${NC}"

# Favicons
rsvg-convert --width=32 --height=32 --format=png --keep-aspect-ratio --output="$OUTPUT_DIR/favicon-32x32.png" "$INPUT_SVG"
rsvg-convert --width=16 --height=16 --format=png --keep-aspect-ratio --output="$OUTPUT_DIR/favicon-16x16.png" "$INPUT_SVG"
echo -e "${GREEN}✅ favicons generated${NC}"

echo -e "\n${GREEN}🎉 All icons generated successfully!${NC}"
echo -e "${BLUE}📁 Icons saved to: $OUTPUT_DIR${NC}\n"

echo -e "${YELLOW}💡 rsvg-convert properly renders SVG strokes, so icons should look correct now!${NC}"
