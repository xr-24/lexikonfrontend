// scripts/3_rollout.ts
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { Board } from "../board";                // ← adjust path if needed
import { buildGaddagFromFile } from "../gaddag"; // ← adjust path if needed

/* ───────── config ───────── */
const DICT_PATH   = "sowpods.txt";
const POSITIONS   = "data/positions.bin";
const TOP_N_MOVES = 25;

/* ensure data/ dir exists */
mkdirSync("data", { recursive: true });

/* helper: in-place shuffle */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = Math.random() * (i + 1) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* random rack from full bag */
function randomRack(): string {
  const BAG = (
    "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIIJKL" +
    "LMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??"
  ).split("");                      // split AFTER concatenation
  return shuffle(BAG).slice(0, 7).join("");
}

/* remove played letters from rack */
function subtractRack(rack: string, used: string): string {
  const freq: Record<string, number> = {};
  for (const ch of used.toUpperCase()) freq[ch] = (freq[ch] ?? 0) + 1;

  const remain: string[] = [];
  for (const ch of rack.toUpperCase()) {
    if (freq[ch]) freq[ch]--;
    else remain.push(ch);
  }
  return remain.join("");
}

/* ───────── main async block ───────── */
(async () => {
  const dict   = new Set(readFileSync(DICT_PATH, "utf8")
                        .trim().split(/\r?\n/).map(w => w.toUpperCase()));
  const gaddag = await buildGaddagFromFile(DICT_PATH);

  const buf       = readFileSync(POSITIONS);
  const posCount  = buf.length / 225;

  interface Stat { sum: number; count: number; }
  const stats: Record<string, Stat> = {};

  for (let p = 0; p < posCount; ++p) {
    const board = new Board(dict);
    board.tiles.set(buf.subarray(p * 225, (p + 1) * 225));   // load snapshot

    const rack  = randomRack();
    const moves = board.generateMoves(rack, gaddag).slice(0, TOP_N_MOVES);

    for (const mv of moves) {
      const leaveKey = subtractRack(rack, mv.rackLettersUsed)
                         .split("").sort().join("");
      const gain     = mv.score;           // one-ply gain

      (stats[leaveKey] ??= { sum: 0, count: 0 }).sum   += gain;
      stats[leaveKey]!.count++;
    }

    if ((p & 1023) === 0) console.log(p, "/", posCount);
  }

  writeFileSync("data/leave_raw.json", JSON.stringify(stats), "utf8");
  console.log("wrote raw stats for", Object.keys(stats).length, "leaves");
})();
