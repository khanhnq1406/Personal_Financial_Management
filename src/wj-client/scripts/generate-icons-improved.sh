#!/bin/bash

# Improved PWA Icon Generator Script
# This script generates PWA icons with proper quality settings
#
# Prerequisites: ImageMagick with SVG support
# Install on macOS: brew install imagemagick
# Install on Ubuntu: sudo apt-get install imagemagick librsvg2-bin
#
# Usage: ./scripts/generate-icons-improved.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

INPUT_SVG="public/logo-icon.svg"
OUTPUT_DIR="public/icons"

# Icon sizes for PWA
SIZES=(72 96 128 144 152 192 384 512)
APPLE_ICON_SIZE=180

echo -e "${BLUE}🎨 Improved PWA Icon Generator${NC}\n"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed${NC}"
    echo -e "${BLUE}Install it with:${NC}"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick librsvg2-bin"
    exit 1
fi

# Check if input SVG exists
if [ ! -f "$INPUT_SVG" ]; then
    echo -e "${RED}❌ Input SVG not found: $INPUT_SVG${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}Generating icons from ${INPUT_SVG} with improved quality...${NC}\n"

# Function to generate icon with proper settings
generate_icon() {
    local size=$1
    local output_file=$2
    local density=$((size * 4))  # Higher density for better quality

    # Use density and proper scaling for better quality
    magick -background none \
            -density "$density" \
            "$INPUT_SVG" \
            -resize "${size}x${size}" \
            -gravity center \
            -extent "${size}x${size}" \
            -quality 100 \
            "$output_file"
}

# Generate standard PWA icons
for size in "${SIZES[@]}"; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}.png"
    generate_icon "$size" "$output_file"

    # Get file size for display
    file_size=$(du -h "$output_file" | cut -f1)
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}.png (${file_size})${NC}"
done

# Generate Apple touch icon (180x180)
generate_icon "$APPLE_ICON_SIZE" "$OUTPUT_DIR/apple-touch-icon.png"
echo -e "${GREEN}✅ Generated: apple-touch-icon.png (${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE})${NC}"

# Generate favicons
generate_icon 32 "$OUTPUT_DIR/favicon-32x32.png"
echo -e "${GREEN}✅ Generated: favicon-32x32.png${NC}"

generate_icon 16 "$OUTPUT_DIR/favicon-16x16.png"
echo -e "${GREEN}✅ Generated: favicon-16x16.png${NC}"

# Generate a high-res version for maskable icons (with padding)
echo -e "\n${BLUE}Generating maskable icons (with padding)...${NC}"
for size in 192 512; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}-maskable.png"

    # Add 20% padding for maskable icons (safe zone)
    inner_size=$((size * 80 / 100))

    # Method 1: Create green background, then composite icon on top
    magick -size "${size}x${size}" xc:"#008148" \
            \( -background none \
               -density $((inner_size * 4)) \
               "$INPUT_SVG" \
               -resize "${inner_size}x${inner_size}" \) \
            -gravity center \
            -composite \
            -quality 100 \
            "$output_file"

    file_size=$(du -h "$output_file" | cut -f1)
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}-maskable.png (${file_size})${NC}"
done

echo -e "\n${GREEN}🎉 All icons generated successfully!${NC}"
echo -e "${BLUE}📁 Icons saved to: $OUTPUT_DIR${NC}\n"

echo -e "${YELLOW}Note: Maskable icons include a safe zone for adaptive icons on Android${NC}"
