#!/bin/bash

# PWA Icon Generator Script
# This script generates all required PWA icons from logo.svg
#
# Prerequisites: ImageMagick with SVG support
# Install on macOS: brew install imagemagick
# Install on Ubuntu: sudo apt-get install imagemagick librsvg2-bin
#
# Usage: ./scripts/generate-icons.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INPUT_SVG="public/logo.svg"
OUTPUT_DIR="public/icons"

# Icon sizes for PWA
SIZES=(72 96 128 144 152 192 384 512)
APPLE_ICON_SIZE=180

echo -e "${BLUE}🎨 PWA Icon Generator${NC}\n"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed${NC}"
    echo -e "${BLUE}Install it with:${NC}"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick librsvg2-bin"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate icons
echo -e "${BLUE}Generating icons...${NC}\n"

for size in "${SIZES[@]}"; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}.png"
    convert -background none -resize "${size}x${size}" "$INPUT_SVG" "$output_file"
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}.png${NC}"
done

# Generate Apple touch icon
convert -background none -resize "${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE}" "$INPUT_SVG" "$OUTPUT_DIR/apple-touch-icon.png"
echo -e "${GREEN}✅ Generated: apple-touch-icon.png (${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE})${NC}"

# Generate favicons
convert -background none -resize "32x32" "$INPUT_SVG" "$OUTPUT_DIR/favicon-32x32.png"
echo -e "${GREEN}✅ Generated: favicon-32x32.png${NC}"

convert -background none -resize "16x16" "$INPUT_SVG" "$OUTPUT_DIR/favicon-16x16.png"
echo -e "${GREEN}✅ Generated: favicon-16x16.png${NC}"

echo -e "\n${GREEN}🎉 All icons generated successfully!${NC}"
echo -e "${BLUE}📁 Icons saved to: $OUTPUT_DIR${NC}"
