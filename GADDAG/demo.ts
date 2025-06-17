// demo.ts
import { Board } from "./board";
import { buildGaddagFromFile } from "./gaddag";
import { readFileSync } from "fs";

(async () => {
  const dictPath = "sowpods.txt";
  const words  = new Set(readFileSync(dictPath,"utf8").trim().split(/\r?\n/).map(w=>w.toUpperCase()));
  const gaddag = await buildGaddagFromFile(dictPath);
  const board  = new Board(words);

  const rack   = process.argv[2] ?? "QUIZZED?";
  const moves  = board.generateMoves(rack, gaddag)
                      .sort((a: any, b: any) => b.equity - a.equity);   // <- cast to any

  console.log("#unique moves =", moves.length);
  console.table(
    moves.slice(0, 15).map((m: any) => ({
      word:   m.word,
      score:  m.score,
      equity: m.equity,
      row:    m.row,
      col:    m.col,
      dir:    m.dir
    }))
  );
})();
