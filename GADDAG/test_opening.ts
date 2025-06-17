// test_opening.ts
import { buildGaddagFromFile } from "./gaddag";
import { BoardPosition } from "./generator";

export async function run(rack: string) {
  const gaddag = await buildGaddagFromFile("sowpods.txt");
  const board  = new BoardPosition();

  const moves = board.generateMoves(rack, gaddag);
  console.log(`#moves = ${moves.length}`);
  for (const m of moves.slice(0, 20))
    console.log(`${m.word} @ (${m.row},${m.col}) ${m.dir}  score=${m.score}`);
}

// When executed directly: `npx ts-node test_opening.ts QUIZZED`
if (require.main === module) {
  const rack = process.argv[2] || "AEIRST";
  run(rack);
}
