// scripts/1_enumerateLeaves.ts
import { writeFileSync, mkdirSync } from "fs";

/* ensure data/ directory exists */
mkdirSync("data", { recursive: true });

const TILE_FREQ: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1,
  L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2,
  W: 2, X: 1, Y: 2, Z: 1, "?": 2,
};

/** depth-first enumeration of all 0–7-tile leaves (alphabetical keys) */
function* gen(
  prefix: string,
  start: string,
  left: Record<string, number>,
  slots: number
): Generator<string> {                 // ← explicit return type
  yield prefix;
  if (!slots) return;

  for (const ch of Object.keys(left).filter(k => k >= start && left[k] > 0)) {
    left[ch]--;
    yield* gen(prefix + ch, ch, left, slots - 1);
    left[ch]++;
  }
}

const leaves = [...gen("", "?", { ...TILE_FREQ }, 7)];
writeFileSync("data/leaves.json", JSON.stringify(leaves), "utf8");

console.log("wrote", leaves.length, "leave keys to data/leaves.json");
