#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from the logo.svg file.
 *
 * Prerequisites:
 * npm install sharp svg2img
 *
 * Usage:
 * node scripts/generate-icons.js
 */

const sharp = require('sharp');
const svg2img = require('svg2img');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_ICON_SIZE = 180;

const inputSvg = path.join(__dirname, '../public/logo.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read SVG file
const svgContent = fs.readFileSync(inputSvg, 'utf8');

console.log('🎨 Generating PWA icons...\n');

// Function to generate icon
async function generateIcon(size, filename) {
  return new Promise((resolve, reject) => {
    svg2img(svgContent, { width: size, height: size }, (error, buffer) => {
      if (error) {
        reject(error);
        return;
      }

      const outputPath = path.join(outputDir, filename);

      // Use sharp to optimize and save
      sharp(buffer)
        .resize(size, size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath)
        .then(() => {
          console.log(`✅ Generated: ${filename} (${size}x${size})`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// Generate all icons
async function generateAllIcons() {
  try {
    // Generate standard PWA icons
    for (const size of ICON_SIZES) {
      await generateIcon(size, `icon-${size}x${size}.png`);
    }

    // Generate Apple touch icon
    await generateIcon(APPLE_ICON_SIZE, 'apple-touch-icon.png');

    // Generate favicon
    await generateIcon(32, 'favicon-32x32.png');
    await generateIcon(16, 'favicon-16x16.png');

    console.log('\n🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateAllIcons();
