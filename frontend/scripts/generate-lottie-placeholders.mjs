import { writeFileSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const lottieDir = join(__dirname, "../public/lottie");

const TEAL = [0.0588, 0.4314, 0.4078, 1];
const GREEN = [0.4824, 0.8824, 0.2314, 1];
const SLATE = [0.0667, 0.0667, 0.0667, 1];

function solidLayer(name, color, size, position, scaleKeyframes, opacityKeyframes) {
  return {
    ty: 4,
    nm: name,
    sr: 1,
    st: 0,
    op: 90,
    ip: 0,
    ks: {
      o: opacityKeyframes ?? { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: position },
      a: { a: 0, k: [0, 0, 0] },
      s: scaleKeyframes,
    },
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [size, size] },
          },
          {
            ty: "fl",
            c: { a: 0, k: color },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
  };
}

function rectLayer(name, color, width, height, position, cornerRadius = 4) {
  return {
    ty: 4,
    nm: name,
    sr: 1,
    st: 0,
    op: 90,
    ip: 0,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: position },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [width, height] },
            r: { a: 0, k: cornerRadius },
          },
          {
            ty: "fl",
            c: { a: 0, k: color },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
  };
}

function pulseScale(min = 85, max = 100) {
  return {
    a: 1,
    k: [
      {
        t: 0,
        s: [min, min, 100],
        i: { x: [0.667], y: [1] },
        o: { x: [0.333], y: [0] },
      },
      {
        t: 45,
        s: [max, max, 100],
        i: { x: [0.667], y: [1] },
        o: { x: [0.333], y: [0] },
      },
      { t: 90, s: [min, min, 100] },
    ],
  };
}

function buildAnimation(layers, name) {
  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 100,
    h: 100,
    nm: name,
    ddd: 0,
    assets: [],
    layers,
  };
}

const variants = {
  "trust-score-reveal.json": buildAnimation(
    [
      solidLayer("Score ring", TEAL, 56, [50, 50, 0], pulseScale(88, 100)),
      solidLayer("Score core", GREEN, 24, [50, 50, 0], { a: 0, k: [100, 100, 100] }),
    ],
    "trust-score-reveal",
  ),
  "principles-lock.json": buildAnimation(
    [
      rectLayer("Lock body", TEAL, 34, 26, [50, 58, 0], 6),
      rectLayer("Lock shackle", TEAL, 22, 18, [50, 36, 0], 8),
      solidLayer("Keyhole", GREEN, 8, [50, 58, 0], pulseScale(90, 110)),
    ],
    "principles-lock",
  ),
  "principles-open-book.json": buildAnimation(
    [
      rectLayer("Book left", TEAL, 24, 40, [38, 52, 0], 3),
      rectLayer("Book right", GREEN, 24, 40, [62, 52, 0], 3),
      rectLayer("Spine", SLATE, 4, 40, [50, 52, 0], 1),
    ],
    "principles-open-book",
  ),
  "principles-exit-door.json": buildAnimation(
    [
      rectLayer("Door frame", TEAL, 42, 58, [50, 52, 0], 6),
      rectLayer("Door panel", GREEN, 30, 50, [46, 52, 0], 4),
      solidLayer("Handle", SLATE, 6, [58, 52, 0], pulseScale(95, 105)),
    ],
    "principles-exit-door",
  ),
  "onboarding-connect.json": buildAnimation(
    [
      solidLayer("Node left", TEAL, 16, [28, 50, 0], pulseScale(90, 105)),
      solidLayer("Node center", GREEN, 20, [50, 50, 0], pulseScale(85, 100)),
      solidLayer("Node right", TEAL, 16, [72, 50, 0], pulseScale(90, 105)),
    ],
    "onboarding-connect",
  ),
  "onboarding-evidence.json": buildAnimation(
    [
      rectLayer("Line 1", TEAL, 44, 6, [50, 38, 0], 3),
      rectLayer("Line 2", TEAL, 36, 6, [50, 50, 0], 3),
      rectLayer("Line 3", GREEN, 28, 6, [50, 62, 0], 3),
    ],
    "onboarding-evidence",
  ),
  "onboarding-passport.json": buildAnimation(
    [
      rectLayer("Passport", TEAL, 46, 58, [50, 52, 0], 8),
      rectLayer("Photo", GREEN, 16, 16, [38, 44, 0], 4),
      rectLayer("Lines", SLATE, 24, 4, [58, 44, 0], 2),
      rectLayer("Line 2", SLATE, 30, 4, [58, 54, 0], 2),
    ],
    "onboarding-passport",
  ),
};

for (const [filename, animation] of Object.entries(variants)) {
  const target = join(lottieDir, filename);
  try {
    const size = statSync(target).size;
    if (size > 500) {
      console.log(`skip ${filename} (${size} bytes, already populated)`);
      continue;
    }
  } catch {
    // file missing — write it
  }
  writeFileSync(target, JSON.stringify(animation));
  console.log(`wrote ${filename}`);
}

const heroPath = join(lottieDir, "hero-shield.json");
try {
  const hero = readFileSync(heroPath, "utf8");
  if (hero.includes('"layers":[]') || hero.length < 500) {
    writeFileSync(
      heroPath,
      JSON.stringify(
        buildAnimation(
          [
            solidLayer("Shield outer", TEAL, 52, [50, 52, 0], pulseScale(92, 102)),
            solidLayer("Shield inner", GREEN, 28, [50, 54, 0], pulseScale(88, 100)),
          ],
          "hero-shield",
        ),
      ),
    );
    console.log("wrote hero-shield.json");
  } else {
    console.log("skip hero-shield.json (already populated)");
  }
} catch {
  console.log("hero-shield.json not found");
}
