#!/bin/bash

# PWA Icon Generator Script for macOS
# Uses built-in sips command (no external dependencies needed)
#
# Usage: ./scripts/generate-icons-macos.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

INPUT_SVG="public/logo.svg"
OUTPUT_DIR="public/icons"
TEMP_PNG="public/icons/temp-logo.png"

# Icon sizes for PWA
SIZES=(72 96 128 144 152 192 384 512)
APPLE_ICON_SIZE=180

echo -e "${BLUE}🎨 PWA Icon Generator for macOS${NC}\n"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Note: Since logo.svg is an SVG file, please follow these steps:${NC}"
echo -e "${YELLOW}1. Open logo.svg in Preview or any image editor${NC}"
echo -e "${YELLOW}2. Export it as a PNG file at 1024x1024 resolution${NC}"
echo -e "${YELLOW}3. Save it as: public/icons/logo-1024.png${NC}"
echo -e "${YELLOW}4. Then run this script again${NC}\n"

# Check if a high-res PNG exists
if [ ! -f "public/icons/logo-1024.png" ]; then
    echo -e "${BLUE}Creating a basic icon structure...${NC}\n"

    # Copy the SVG as a fallback
    cp "$INPUT_SVG" "$OUTPUT_DIR/icon.svg"
    echo -e "${GREEN}✅ Copied SVG to icons directory${NC}"

    echo -e "\n${YELLOW}⚠️  To complete icon generation:${NC}"
    echo "1. Convert logo.svg to a high-resolution PNG (1024x1024)"
    echo "2. Save it as: public/icons/logo-1024.png"
    echo "3. Run: ./scripts/generate-icons-macos.sh"
    exit 0
fi

INPUT_PNG="public/icons/logo-1024.png"

echo -e "${BLUE}Generating icons from ${INPUT_PNG}...${NC}\n"

# Generate icons using sips
for size in "${SIZES[@]}"; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}.png"
    sips -z "$size" "$size" "$INPUT_PNG" --out "$output_file" > /dev/null 2>&1
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}.png${NC}"
done

# Generate Apple touch icon
sips -z "$APPLE_ICON_SIZE" "$APPLE_ICON_SIZE" "$INPUT_PNG" --out "$OUTPUT_DIR/apple-touch-icon.png" > /dev/null 2>&1
echo -e "${GREEN}✅ Generated: apple-touch-icon.png (${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE})${NC}"

# Generate favicons
sips -z 32 32 "$INPUT_PNG" --out "$OUTPUT_DIR/favicon-32x32.png" > /dev/null 2>&1
echo -e "${GREEN}✅ Generated: favicon-32x32.png${NC}"

sips -z 16 16 "$INPUT_PNG" --out "$OUTPUT_DIR/favicon-16x16.png" > /dev/null 2>&1
echo -e "${GREEN}✅ Generated: favicon-16x16.png${NC}"

echo -e "\n${GREEN}🎉 All icons generated successfully!${NC}"
echo -e "${BLUE}📁 Icons saved to: $OUTPUT_DIR${NC}"
