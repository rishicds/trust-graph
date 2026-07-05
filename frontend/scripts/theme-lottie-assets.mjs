import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const lottieDir = join(__dirname, "../public/lottie");

/** TrustGraph palette — RGB 0–1 */
const BRAND = {
  teal: [15 / 255, 110 / 255, 104 / 255],
  green: [123 / 255, 225 / 255, 59 / 255],
  black: [17 / 255, 17 / 255, 17 / 255],
  muted: [119 / 255, 119 / 255, 119 / 255],
};

function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hue([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let h;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return ((h * 60) + 360) % 360;
}

function isNeutral([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 0.08;
}

function isWhite([r, g, b]) {
  return r > 0.92 && g > 0.92 && b > 0.92;
}

function mapColor(rgb, alpha = 1) {
  const [r, g, b] = rgb;
  const a = alpha ?? 1;

  if (a < 0.05) return [r, g, b, a];
  if (isWhite([r, g, b])) return [r, g, b, a];

  const lum = luminance([r, g, b]);
  const h = hue([r, g, b]);

  if (lum < 0.22) return [...BRAND.black, a];
  if (isNeutral([r, g, b])) {
    return lum > 0.55 ? [...BRAND.green, a] : [...BRAND.teal, a];
  }
  if (h >= 40 && h <= 165) return [...BRAND.green, a];
  return [...BRAND.teal, a];
}

function themeColorValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 3 && value.every((n) => typeof n === "number" && n >= 0 && n <= 1)) {
      return mapColor(value);
    }
    if (value.length === 4 && value.slice(0, 3).every((n) => typeof n === "number" && n >= 0 && n <= 1)) {
      return mapColor(value.slice(0, 3), value[3]);
    }
    return value.map((item) => themeNode(item));
  }

  if (value && typeof value === "object") {
    return themeNode(value);
  }

  return value;
}

function themeNode(node) {
  if (Array.isArray(node)) {
    return node.map((item) => themeNode(item));
  }

  if (!node || typeof node !== "object") return node;

  const next = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "ef") {
      continue;
    }

    if (key === "c" || key === "fc" || key === "sc") {
      if (value && typeof value === "object" && "k" in value) {
        const k = value.k;
        if (Array.isArray(k) && k.length > 0 && typeof k[0] === "object" && "s" in k[0]) {
          next[key] = {
            ...value,
            k: k.map((frame) => ({
              ...frame,
              s: Array.isArray(frame.s) ? mapColor(frame.s.slice(0, 3), frame.s[3]) : frame.s,
            })),
          };
        } else {
          next[key] = { ...value, k: themeColorValue(k) };
        }
      } else {
        next[key] = themeColorValue(value);
      }
      continue;
    }

    if (key === "s" && Array.isArray(value) && (value.length === 3 || value.length === 4)) {
      next[key] = themeColorValue(value);
      continue;
    }

    next[key] = themeNode(value);
  }
  return next;
}

const skip = new Set(["placeholder.json"]);

for (const file of readdirSync(lottieDir).filter((name) => name.endsWith(".json"))) {
  if (skip.has(file)) continue;

  const path = join(lottieDir, file);
  const raw = readFileSync(path, "utf8");
  if (raw.length < 200) {
    console.log(`skip ${file} (empty)`);
    continue;
  }

  const themed = themeNode(JSON.parse(raw));
  writeFileSync(path, JSON.stringify(themed));
  console.log(`themed ${file}`);
}
