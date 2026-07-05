import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, "../public/lottie/onboarding-evidence.json");

const TEAL = [15 / 255, 110 / 255, 104 / 255, 1];
const GREEN = [123 / 255, 225 / 255, 59 / 255, 1];
const WHITE = [1, 1, 1, 1];
const BLACK = [17 / 255, 17 / 255, 17 / 255, 1];

function setFillColor(shapeItem, color) {
  if (shapeItem?.ty !== "fl" || !shapeItem.c) return;
  shapeItem.c.a = 0;
  shapeItem.c.k = color;
}

function setStrokeColor(shapeItem, color) {
  if (shapeItem?.ty !== "st" || !shapeItem.c) return;
  shapeItem.c.a = 0;
  shapeItem.c.k = color.slice(0, 3);
}

function recolorShapes(shapes, fillColor, strokeColor) {
  if (!Array.isArray(shapes)) return;
  for (const group of shapes) {
    for (const item of group.it ?? []) {
      if (fillColor) setFillColor(item, fillColor);
      if (strokeColor) setStrokeColor(item, strokeColor);
    }
  }
}

function isTealFill(shapes) {
  const fill = shapes?.[0]?.it?.find((i) => i.ty === "fl");
  const k = fill?.c?.k;
  if (!Array.isArray(k)) return false;
  return k[0] < 0.15 && k[1] > 0.35 && k[2] > 0.35;
}

function walkLayers(layers) {
  if (!Array.isArray(layers)) return;

  for (const layer of layers) {
    delete layer.ef;

    const name = layer.nm ?? "";

    if (/^Shape Layer [123]$/.test(name) && layer.shapes?.[0]?.it?.some((i) => i.ty === "el")) {
      recolorShapes(layer.shapes, TEAL);
      continue;
    }

    if (name === "Capa 1 Outlines" || name === "Layer 3 Outlines") {
      recolorShapes(layer.shapes, WHITE, TEAL);
      continue;
    }

    if (name === "Layer 2 Outlines") {
      for (const group of layer.shapes ?? []) {
        for (const item of group.it ?? []) {
          if (item.ty === "fl") {
            const isCheck = group.nm?.includes("7") || group.nm?.includes("8");
            setFillColor(item, isCheck ? GREEN : WHITE);
          }
        }
      }
      continue;
    }

    if (name.includes("Layer 4") || name.includes("Outlines")) {
      recolorShapes(layer.shapes, isTealFill(layer.shapes) ? TEAL : GREEN);
      continue;
    }

    if (layer.shapes) {
      recolorShapes(layer.shapes, GREEN);
    }
  }
}

const data = JSON.parse(readFileSync(path, "utf8"));
walkLayers(data.layers);
for (const asset of data.assets ?? []) {
  walkLayers(asset.layers);
}

writeFileSync(path, JSON.stringify(data));
console.log("recolored onboarding-evidence.json");
