import { buildGaddagFromFile } from "./gaddag";
import { Board } from "./board";
import { BoardPosition } from "./generator";
import { readFileSync } from "fs";

(async () => {
  const dictPath = "sowpods.txt";

  /* dictionary Set<String> */
  const words = new Set(
    readFileSync(dictPath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map(w => w.toUpperCase())
  );

  /* 1 ▸ persistent board that you mutate during the game */
  const board = new Board(words);

  /* 2 ▸ GADDAG built once */
  const gaddag = await buildGaddagFromFile(dictPath);

  /* 3 ▸ lightweight view for move generation */
  const position = new BoardPosition(board.crossMask, board.anchor, board.tiles);

  /* 4 ▸ generate moves */
  const moves = position.generateMoves("QUIZZED?", gaddag);
  console.log("#unique moves =", moves.length);
})();
