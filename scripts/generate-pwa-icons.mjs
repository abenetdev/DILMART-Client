/**
 * DilMart PWA Icon Generator
 *
 * Takes the existing logo.png (919x271, landscape) and produces square PNG
 * icons for PWA use by compositing the logo onto a brand-teal (#0D9388) square.
 *
 * Output files (all placed in public/icons/):
 *   icon-192x192.png      — standard PWA icon
 *   icon-512x512.png      — standard PWA icon (splash / install)
 *   icon-maskable-192.png — maskable icon (safe-zone padded)
 *   icon-maskable-512.png — maskable icon (safe-zone padded)
 *   apple-touch-icon.png  — 180×180 for iOS home screen
 */

import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SRC_LOGO = resolve(ROOT, "src/assets/logo.png");
const OUT_DIR  = resolve(ROOT, "public/icons");

// DilMart brand teal: HSL(176,84%,31%) ≈ RGB(13,147,136)
const BRAND_R = 13;
const BRAND_G = 147;
const BRAND_B = 136;

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

/**
 * Create a square PNG with the logo centred on the brand-teal background.
 *
 * @param {number} size         - Output canvas size in px (square)
 * @param {number} logoPct      - Logo width as % of canvas width (0–1)
 * @param {string} outFile      - Destination file path
 */
async function makeIcon(size, logoPct, outFile) {
  const logoWidth  = Math.round(size * logoPct);
  // Resize logo proportionally to fit the target width
  const logoResized = await sharp(SRC_LOGO)
    .resize({ width: logoWidth, fit: "inside", withoutEnlargement: false })
    .toBuffer({ resolveWithObject: true });

  const { width: lw, height: lh } = logoResized.info;

  // Centre the logo on the brand-coloured square
  const left = Math.round((size - lw) / 2);
  const top  = Math.round((size - lh) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: BRAND_R, g: BRAND_G, b: BRAND_B },
    },
  })
    .composite([{ input: logoResized.data, left, top }])
    .png()
    .toFile(outFile);

  console.log(`  ✓  ${outFile.replace(ROOT, ".")}  (${size}×${size})`);
}

/**
 * Maskable icons use a "safe zone" of 40% of the canvas (Google spec).
 * The logo is drawn into the inner 60%, leaving a 20% border on each side.
 */
async function makeMaskableIcon(size, outFile) {
  // safe zone: logo occupies 60% of canvas width
  await makeIcon(size, 0.60, outFile);
}

console.log("\nGenerating DilMart PWA icons …\n");

await Promise.all([
  // Standard icons — logo fills ~75% of canvas
  makeIcon(192, 0.75, resolve(OUT_DIR, "icon-192x192.png")),
  makeIcon(512, 0.75, resolve(OUT_DIR, "icon-512x512.png")),
  makeIcon(180, 0.75, resolve(OUT_DIR, "apple-touch-icon.png")),

  // Maskable icons — logo inside 60% safe zone
  makeMaskableIcon(192, resolve(OUT_DIR, "icon-maskable-192.png")),
  makeMaskableIcon(512, resolve(OUT_DIR, "icon-maskable-512.png")),
]);

console.log("\nAll icons generated successfully.\n");
