/*
 * generator.ts — Scrabble move generator (GADDAG-based)
 *
 * Implemented features
 * ───────────────────────────────────────────────────────────────────
 *   ✓ Prefix-plus-suffix traversal using the GADDAG
 *   ✓ Blank-tile support (“?”)
 *   ✓ Full scoring: letter/word multipliers, cross-words, 50-pt bingo
 *   ✓ Duplicate-move pruning   (highest-score per (row,col,dir,word))
 *   ✓ Dictionary-driven cross-check masks ← NEW
 *
 * Todo / future work
 * ───────────────────────────────────────────────────────────────────
 *   • Incremental cross-check refresh (speed)
 *   • Quackle-style heuristic pruning / move ordering
 */

import {
  BOARD_SIZE,
  NUM_SQUARES,
  index,
  rowOf,
  colOf,
  LETTER_MULT,
  WORD_MULT,
} from "./board";
import { Gaddag, SEPARATOR_CODE } from "./gaddag";

/* ───────────────────────────── Helpers ───────────────────────────── */

const BLANK_CHAR = "?";
const LETTER_SCORE = [
  1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1,
  3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10,
];
const LETTER_BIT = (c: number) => 1 << (c - 65);
const ALL_MASK = (1 << 26) - 1;

type Dir = "H" | "V";
const DELTAS: Record<Dir, [number, number]> = { H: [0, 1], V: [1, 0] };

interface BuiltTile { code: number; blank: boolean; }

export interface Move {
  row: number; col: number; dir: Dir;
  word: string; score: number; rackLettersUsed: string;
}

/* ───────────────────── BoardPosition class ───────────────────── */

export class BoardPosition {
  readonly tiles      = new Uint8Array(NUM_SQUARES);
  readonly crossMask  = new Uint32Array(NUM_SQUARES);   // per-square A-Z mask
  readonly anchor     = new Uint8Array(NUM_SQUARES);    // 1 = anchor

  /** fast word-lookup for cross-checks */
  constructor(private readonly dict: ReadonlySet<string>) {
    this.recomputeAuxiliaryInfo();
  }

  /* ── rebuild anchor + crossMask arrays (slow but simple) ── */
  recomputeAuxiliaryInfo() {
    this.crossMask.fill(ALL_MASK);
    this.anchor.fill(0);
    this.anchor[index(7, 7)] = 1;

    for (let idx = 0; idx < NUM_SQUARES; ++idx) {
      if (this.tiles[idx]) { this.crossMask[idx] = 0; continue; }

      const r = rowOf(idx), c = colOf(idx);

      // vertical cross word (affects H placements)
      const above: number[] = [];
      for (let rr = r - 1; rr >= 0 && this.tiles[index(rr, c)]; --rr)
        above.unshift(this.tiles[index(rr, c)]);
      const below: number[] = [];
      for (let rr = r + 1; rr < BOARD_SIZE && this.tiles[index(rr, c)]; ++rr)
        below.push(this.tiles[index(rr, c)]);

      if (above.length || below.length) {
        // build mask by iterating A-Z words in dict
        let mask = 0;
        const prefix = String.fromCharCode(...above);
        const suffix = String.fromCharCode(...below);
        for (let L = 65; L <= 90; ++L) {
          const candidate = prefix + String.fromCharCode(L) + suffix;
          if (this.dict.has(candidate)) mask |= LETTER_BIT(L);
        }
        this.crossMask[idx] = mask;
      }

      // horizontal neighbour => anchor
      if (
        (r && this.tiles[index(r - 1, c)]) ||
        (r < BOARD_SIZE - 1 && this.tiles[index(r + 1, c)]) ||
        (c && this.tiles[index(r, c - 1)]) ||
        (c < BOARD_SIZE - 1 && this.tiles[index(r, c + 1)])
      ) this.anchor[idx] = 1;
    }
  }

  /* ── main entry point ── */
  generateMoves(rack: string, g: Gaddag): Move[] {
    const raw: Move[] = [];
    for (let idx = 0; idx < NUM_SQUARES; ++idx) if (this.anchor[idx])
      for (const d of ["H", "V"] as const) {
        const limit = this.maxPrefix(idx, d);
        this.leftPart(idx, d, rack, g, 0, limit, raw, []);
      }
    return dedupe(raw);
  }

  /* ───────── prefix recursion (LeftPart) ───────── */

  private leftPart(
    anchor: number, dir: Dir, rack: string, g: Gaddag,
    node: number, limit: number, out: Move[], pref: BuiltTile[],
  ) {
    const pivot = child(g, node, SEPARATOR_CODE);
    if (pivot !== -1)
      this.extRight(anchor, dir, rack, g, pivot, out,
                    [...pref, { code: SEPARATOR_CODE, blank: false }], 0);
    if (!limit) return;

    const [dr, dc] = DELTAS[dir];
    const row = rowOf(anchor) - dr * (pref.length + 1);
    const col = colOf(anchor) - dc * (pref.length + 1);
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return;
    const idx = index(row, col);
    if (this.tiles[idx]) return;

    const mask = this.crossMask[idx];
    if (!mask) return;

    for (let i = 0; i < rack.length; ++i) {
      const ch = rack[i];
      if (ch === BLANK_CHAR) {
        for (let L = 65; L <= 90; ++L) {
          if (!(mask & LETTER_BIT(L))) continue;
          const next = child(g, node, L); if (next === -1) continue;
          this.leftPart(anchor, dir,
            rack.slice(0, i) + rack.slice(i + 1),
            g, next, limit - 1, out,
            [...pref, { code: L, blank: true }],
          );
        }
      } else {
        const code = ch.charCodeAt(0);
        if (!(mask & LETTER_BIT(code))) continue;
        const next = child(g, node, code); if (next === -1) continue;
        this.leftPart(anchor, dir,
          rack.slice(0, i) + rack.slice(i + 1),
          g, next, limit - 1, out,
          [...pref, { code, blank: false }],
        );
      }
    }
  }

  /* ───────── suffix recursion (ExtendRight) ───────── */

  private extRight(
    anchor: number, dir: Dir, rack: string, g: Gaddag, node: number,
    out: Move[], built: BuiltTile[], off: number,
  ) {
    const [dr, dc] = DELTAS[dir];
    const row = rowOf(anchor) + dr * off;
    const col = colOf(anchor) + dc * off;
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return;
    const idx = index(row, col);

    if (this.tiles[idx]) {
      const next = child(g, node, this.tiles[idx]); if (next === -1) return;
      built.push({ code: this.tiles[idx], blank: false });
      if (g.isTerminal(next)) this.record(anchor, dir, built, out);
      this.extRight(anchor, dir, rack, g, next, out, built, off + 1);
      built.pop();
      return;
    }

    const mask = this.crossMask[idx];
    if (!mask) return;

    for (let i = 0; i < rack.length; ++i) {
      const ch = rack[i];
      if (ch === BLANK_CHAR) {
        for (let L = 65; L <= 90; ++L) {
          if (!(mask & LETTER_BIT(L))) continue;
          const next = child(g, node, L); if (next === -1) continue;
          built.push({ code: L, blank: true });
          const newRack = rack.slice(0, i) + rack.slice(i + 1);
          if (g.isTerminal(next)) this.record(anchor, dir, built, out);
          this.extRight(anchor, dir, newRack, g, next, out, built, off + 1);
          built.pop();
        }
      } else {
        const code = ch.charCodeAt(0);
        if (!(mask & LETTER_BIT(code))) continue;
        const next = child(g, node, code); if (next === -1) continue;
        built.push({ code, blank: false });
        const newRack = rack.slice(0, i) + rack.slice(i + 1);
        if (g.isTerminal(next)) this.record(anchor, dir, built, out);
        this.extRight(anchor, dir, newRack, g, next, out, built, off + 1);
        built.pop();
      }
    }
  }

  /* ───────── move capture + scoring ───────── */

  private record(anchor: number, dir: Dir, tiles: BuiltTile[], out: Move[]) {
    const sep = tiles.findIndex(t => t.code === SEPARATOR_CODE);
    const prefix = tiles.slice(0, sep).reverse(), suffix = tiles.slice(sep + 1);
    const wordTiles = [...prefix, ...suffix];
    if (!wordTiles.length) return;

    const startRow = rowOf(anchor) - (dir === "V" ? prefix.length : 0);
    const startCol = colOf(anchor) - (dir === "H" ? prefix.length : 0);

    const { total, placed } = this.score(startRow, startCol, dir, wordTiles);
    if (!placed) return;

    const word = String.fromCharCode(...wordTiles.map(t => t.code));
    const rackUsed = wordTiles.map(t =>
      t.blank ? String.fromCharCode(t.code).toLowerCase() : String.fromCharCode(t.code)
    ).join("");

    out.push({ row: startRow, col: startCol, dir, word, score: total, rackLettersUsed: rackUsed });
  }

  private score(r0: number, c0: number, dir: Dir, tiles: BuiltTile[]) {
    const [dr, dc] = DELTAS[dir];
    let main = 0, mult = 1, placed = 0, cross = 0;

    for (let i = 0; i < tiles.length; ++i) {
      const r = r0 + dr * i, c = c0 + dc * i, idx = index(r, c);
      const { code, blank } = tiles[i];
      const base = blank ? 0 : LETTER_SCORE[code - 65];

      if (this.tiles[idx]) {
        main += base;
      } else {
        placed++;
        main += base * (blank ? 1 : LETTER_MULT[idx]);
        mult *= WORD_MULT[idx];
        cross += this.crossScore(r, c, dir, base, blank);
      }
    }
    let total = main * mult + cross;
    if (placed === 7) total += 50;
    return { total, placed };
  }

  private crossScore(r: number, c: number, d: Dir, base: number, blank: boolean) {
    const perp: Dir = d === "H" ? "V" : "H";
    const [dr, dc] = DELTAS[perp];
    let before = 0, after = 0;

    for (let rr = r - dr, cc = c - dc;
         rr >= 0 && cc >= 0 && rr < BOARD_SIZE && cc < BOARD_SIZE &&
         this.tiles[index(rr, cc)];
         rr -= dr, cc -= dc)
      before += LETTER_SCORE[this.tiles[index(rr, cc)] - 65];

    for (let rr = r + dr, cc = c + dc;
         rr >= 0 && cc >= 0 && rr < BOARD_SIZE && cc < BOARD_SIZE &&
         this.tiles[index(rr, cc)];
         rr += dr, cc += dc)
      after += LETTER_SCORE[this.tiles[index(rr, cc)] - 65];

    if (!before && !after) return 0;
    const idx = index(r, c);
    const lScore = blank ? 0 : base * LETTER_MULT[idx];
    return (before + lScore + after) * WORD_MULT[idx];
  }

  private maxPrefix(idx: number, d: Dir) {
    const [dr, dc] = DELTAS[d];
    let r = rowOf(idx) - dr, c = colOf(idx) - dc, dist = 0;
    while (r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE &&
           !this.tiles[index(r, c)] && dist < 7) {
      dist++; r -= dr; c -= dc;
    }
    return dist;
  }
}

/* ───────────────────── utility helpers ───────────────────── */

function child(g: Gaddag, p: number, ch: number) {
  let n = g.firstChildIndex(p);
  while (n !== -1) {
    if (g.letter(n).charCodeAt(0) === ch) return n;
    n = g.nextSiblingIndex(n);
  }
  return -1;
}

function dedupe(mv: Move[]): Move[] {
  const best = new Map<string, Move>();
  for (const m of mv) {
    const key = `${m.row}-${m.col}-${m.dir}-${m.word}`;
    const prev = best.get(key);
    if (!prev || m.score > prev.score) best.set(key, m);
  }
  return [...best.values()];
}
