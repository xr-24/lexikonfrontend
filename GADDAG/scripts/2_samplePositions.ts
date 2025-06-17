import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { Board } from "../board";                       // adjust path if needed
import { buildGaddagFromFile } from "../gaddag";        // adjust path if needed

/* create data/ folder if it doesn’t exist */
mkdirSync("data", { recursive: true });

const SAMPLES   = 20_000;     // lower for quick test
const MIN_BAG   = 40;
const MAX_BAG   = 70;
const DICT_PATH = "sowpods.txt";

const FULL_BAG =
  "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIIJKL" +
  "LMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??"
    .split("");

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = Math.random() * (i + 1) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

(async () => {
  const words = new Set(
    readFileSync(DICT_PATH, "utf8").trim().split(/\r?\n/).map(w => w.toUpperCase())
  );
  const gaddag = await buildGaddagFromFile(DICT_PATH);

  const out: Uint8Array[] = [];

  while (out.length < SAMPLES) {
    const bag = shuffle([...FULL_BAG]);
    const board = new Board(words);
    let bagIdx = 0;

    while (bag.length - bagIdx >= MIN_BAG + 7 &&
           bag.length - bagIdx <= MAX_BAG + 7) {

      const rack = bag.slice(bagIdx, bagIdx + 7).join("");
      bagIdx += 7;

      const moves = board.generateMoves(rack, gaddag);
      if (!moves.length) break;

      const mv = moves[Math.random() * moves.length | 0];
      board.place(
        mv.row,
        mv.col,
        mv.dir,
        mv.word.split("").map((c: string) => c.charCodeAt(0))  // type added
      );
    }
    out.push(board.tiles);
    if ((out.length & 1023) === 0)
      console.log(out.length, "/", SAMPLES);
  }

  writeFileSync("data/positions.bin", Buffer.concat(out.map(u => Buffer.from(u))));
  console.log("saved", out.length, "positions to data/positions.bin");
})();
