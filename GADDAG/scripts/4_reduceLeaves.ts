// scripts/4_reduceLeaves.ts
import { writeFileSync, readFileSync } from "fs";
const raw: Record<string,{sum:number,count:number}> =
  JSON.parse(readFileSync("data/leave_raw.json","utf8"));

const table: Record<string, number> = {};
for (const [k,{sum,count}] of Object.entries(raw)) {
  if (count >= 50) {        // ignore noisy leaves
    table[k] = Math.round(sum / count);
  }
}
writeFileSync(
  "src/leave.ts",
  `/* auto-generated */\nexport const LEAVE_EQUITY=${JSON.stringify(table,null,2)};\n`+
  `export function leaveEquity(s:string){return LEAVE_EQUITY[s.split('').sort().join('')]||0;}\n`,
  "utf8"
);
console.log("leave table size", Object.keys(table).length);
