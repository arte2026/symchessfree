/**
 * generate_mate1.js  -  standalone procedural "Mate in 1" puzzle generator.
 *
 * How it works
 *   1. A pattern template (back-rank, Boden, smothered, ...) places the key pieces.
 *   2. Random filler (white king, a few pawns) is added, then the board is randomly
 *      mirrored left/right and optionally colour-flipped (Black to move).
 *   3. A legal move generator checks the position: it must be legal and have EXACTLY ONE
 *      mating move, and that move must be made by the piece the pattern is about.
 *   4. Duplicates (including mirror images) are dropped. Result goes to JSON.
 *
 * Works both in Node (CLI) and in the browser (<script src> -> window.Mate1.generate()).
 * All puzzles are WHITE to move (use --mixed on the CLI to also get Black-to-move ones).
 *
 * Usage
 *   node generate_mate1.js                      # 40 puzzles per pattern -> puzzles_mate1.json
 *   node generate_mate1.js --per-pattern 100 --seed 7 --out my.json
 *   node generate_mate1.js --test               # perft validation of the move generator
 *   node generate_mate1.js --show               # print one ASCII diagram per pattern
 *   node generate_mate1.js --list               # list pattern ids
 *
 * No dependencies. Square index = rank*8 + file (a1 = 0, h8 = 63).
 */
(function () {            // everything lives inside this function so nothing leaks into the page's globals
'use strict';

// ============================================================================
//  Board basics
// ============================================================================
const FILES = 'abcdefgh';
const sqName = (i) => FILES[i & 7] + ((i >> 3) + 1);
const nameToSq = (s) => (s.charCodeAt(0) - 97) + (s.charCodeAt(1) - 49) * 8;
const isW = (p) => p >= 'A' && p <= 'Z';

const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function parseFen(fen) {
  const [pl, turn, cas, ep] = fen.split(' ');
  const b = new Array(64).fill('');
  const rows = pl.split('/');
  for (let i = 0; i < 8; i++) {
    let f = 0;
    const r = 7 - i;
    for (const c of rows[i]) {
      if (c >= '1' && c <= '8') f += +c;
      else b[r * 8 + f++] = c;
    }
  }
  return { b, turn, castle: !cas || cas === '-' ? '' : cas, ep: ep && ep !== '-' ? nameToSq(ep) : -1 };
}

function toFen(pos) {
  let out = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.b[r * 8 + f];
      if (!p) empty++;
      else { if (empty) { row += empty; empty = 0; } row += p; }
    }
    if (empty) row += empty;
    out.push(row);
  }
  return `${out.join('/')} ${pos.turn} ${pos.castle || '-'} ${pos.ep >= 0 ? sqName(pos.ep) : '-'} 0 1`;
}

function attacked(b, s, by) {
  const f = s & 7, r = s >> 3, w = by === 'w';
  const pr = w ? r - 1 : r + 1;
  if (pr >= 0 && pr < 8) {
    const pp = w ? 'P' : 'p';
    if (f > 0 && b[pr * 8 + f - 1] === pp) return true;
    if (f < 7 && b[pr * 8 + f + 1] === pp) return true;
  }
  const N = w ? 'N' : 'n', K = w ? 'K' : 'k', B = w ? 'B' : 'b', R = w ? 'R' : 'r', Q = w ? 'Q' : 'q';
  for (const [df, dr] of KN) {
    const ff = f + df, rr = r + dr;
    if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && b[rr * 8 + ff] === N) return true;
  }
  for (const [df, dr] of KG) {
    const ff = f + df, rr = r + dr;
    if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && b[rr * 8 + ff] === K) return true;
  }
  for (const [df, dr] of DIAG) {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const p = b[rr * 8 + ff];
      if (p) { if (p === B || p === Q) return true; break; }
      ff += df; rr += dr;
    }
  }
  for (const [df, dr] of ORTH) {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const p = b[rr * 8 + ff];
      if (p) { if (p === R || p === Q) return true; break; }
      ff += df; rr += dr;
    }
  }
  return false;
}

function kingSq(b, color) {
  const k = color === 'w' ? 'K' : 'k';
  for (let i = 0; i < 64; i++) if (b[i] === k) return i;
  return -1;
}

const CASTLE_LOSS = { 4: 'KQ', 60: 'kq', 0: 'Q', 7: 'K', 56: 'q', 63: 'k' };

function make(pos, m) {
  const b = pos.b.slice();
  const w = pos.turn === 'w';
  b[m.from] = '';
  if (m.flag === 'ep') b[m.to + (w ? -8 : 8)] = '';
  b[m.to] = m.promo ? (w ? m.promo : m.promo.toLowerCase()) : m.piece;
  if (m.flag === 'cK') { if (w) { b[7] = ''; b[5] = 'R'; } else { b[63] = ''; b[61] = 'r'; } }
  if (m.flag === 'cQ') { if (w) { b[0] = ''; b[3] = 'R'; } else { b[56] = ''; b[59] = 'r'; } }
  let c = pos.castle;
  for (const s of [m.from, m.to]) {
    const loss = CASTLE_LOSS[s];
    if (loss) c = c.split('').filter((ch) => !loss.includes(ch)).join('');
  }
  return { b, turn: w ? 'b' : 'w', castle: c, ep: m.flag === 'dbl' ? (m.from + m.to) / 2 : -1 };
}

function genMoves(pos) {
  const { b } = pos;
  const w = pos.turn === 'w';
  const enemy = w ? 'b' : 'w';
  const pseudo = [];
  for (let s = 0; s < 64; s++) {
    const p = b[s];
    if (!p || isW(p) !== w) continue;
    const f = s & 7, r = s >> 3, t = p.toUpperCase();
    if (t === 'P') {
      const dir = w ? 1 : -1, startR = w ? 1 : 6, promoR = w ? 7 : 0, r1 = r + dir;
      const push = (to, cap) => {
        if ((to >> 3) === promoR) for (const pr of 'QRBN') pseudo.push({ from: s, to, piece: p, promo: pr, cap: !!cap });
        else pseudo.push({ from: s, to, piece: p, cap: !!cap });
      };
      if (r1 >= 0 && r1 < 8) {
        if (!b[r1 * 8 + f]) {
          push(r1 * 8 + f, false);
          if (r === startR && !b[(r + 2 * dir) * 8 + f]) pseudo.push({ from: s, to: (r + 2 * dir) * 8 + f, piece: p, flag: 'dbl' });
        }
        for (const df of [-1, 1]) {
          const ff = f + df;
          if (ff < 0 || ff > 7) continue;
          const to = r1 * 8 + ff, q = b[to];
          if (q && isW(q) !== w) push(to, true);
          else if (to === pos.ep) pseudo.push({ from: s, to, piece: p, flag: 'ep', cap: true });
        }
      }
    } else if (t === 'N' || t === 'K') {
      for (const [df, dr] of t === 'N' ? KN : KG) {
        const ff = f + df, rr = r + dr;
        if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
        const q = b[rr * 8 + ff];
        if (q && isW(q) === w) continue;
        pseudo.push({ from: s, to: rr * 8 + ff, piece: p, cap: !!q });
      }
      if (t === 'K') {
        if (w && s === 4 && !attacked(b, 4, 'b')) {
          if (pos.castle.includes('K') && !b[5] && !b[6] && b[7] === 'R' && !attacked(b, 5, 'b') && !attacked(b, 6, 'b'))
            pseudo.push({ from: 4, to: 6, piece: p, flag: 'cK' });
          if (pos.castle.includes('Q') && !b[3] && !b[2] && !b[1] && b[0] === 'R' && !attacked(b, 3, 'b') && !attacked(b, 2, 'b'))
            pseudo.push({ from: 4, to: 2, piece: p, flag: 'cQ' });
        }
        if (!w && s === 60 && !attacked(b, 60, 'w')) {
          if (pos.castle.includes('k') && !b[61] && !b[62] && b[63] === 'r' && !attacked(b, 61, 'w') && !attacked(b, 62, 'w'))
            pseudo.push({ from: 60, to: 62, piece: p, flag: 'cK' });
          if (pos.castle.includes('q') && !b[59] && !b[58] && !b[57] && b[56] === 'r' && !attacked(b, 59, 'w') && !attacked(b, 58, 'w'))
            pseudo.push({ from: 60, to: 58, piece: p, flag: 'cQ' });
        }
      }
    } else {
      const dirs = t === 'B' ? DIAG : t === 'R' ? ORTH : DIAG.concat(ORTH);
      for (const [df, dr] of dirs) {
        let ff = f + df, rr = r + dr;
        while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
          const q = b[rr * 8 + ff];
          if (q) { if (isW(q) !== w) pseudo.push({ from: s, to: rr * 8 + ff, piece: p, cap: true }); break; }
          pseudo.push({ from: s, to: rr * 8 + ff, piece: p, cap: false });
          ff += df; rr += dr;
        }
      }
    }
  }
  const legal = [];
  for (const m of pseudo) {
    const np = make(pos, m);
    if (!attacked(np.b, kingSq(np.b, pos.turn), enemy)) legal.push(m);
  }
  return legal;
}

function inCheck(pos) {
  return attacked(pos.b, kingSq(pos.b, pos.turn), pos.turn === 'w' ? 'b' : 'w');
}

function perft(pos, d) {
  if (d === 0) return 1;
  const ms = genMoves(pos);
  if (d === 1) return ms.length;
  let n = 0;
  for (const m of ms) n += perft(make(pos, m), d - 1);
  return n;
}

function san(pos, m, moves) {
  const t = m.piece.toUpperCase();
  let s = '';
  if (m.flag === 'cK') s = 'O-O';
  else if (m.flag === 'cQ') s = 'O-O-O';
  else if (t === 'P') {
    if (m.cap) s += FILES[m.from & 7] + 'x';
    s += sqName(m.to);
    if (m.promo) s += '=' + m.promo;
  } else {
    s += t;
    const others = moves.filter((o) => o !== m && o.piece === m.piece && o.to === m.to);
    if (others.length) {
      const sameFile = others.some((o) => (o.from & 7) === (m.from & 7));
      const sameRank = others.some((o) => (o.from >> 3) === (m.from >> 3));
      if (!sameFile) s += FILES[m.from & 7];
      else if (!sameRank) s += (m.from >> 3) + 1;
      else s += sqName(m.from);
    }
    if (m.cap) s += 'x';
    s += sqName(m.to);
  }
  const np = make(pos, m);
  if (inCheck(np)) s += genMoves(np).length ? '+' : '#';
  return s;
}

/** All moves that checkmate immediately. */
function matingMoves(pos, moves) {
  const out = [];
  for (const m of moves || genMoves(pos)) {
    const np = make(pos, m);
    if (inCheck(np) && genMoves(np).length === 0) out.push(m);
  }
  return out;
}

// ============================================================================
//  Perft self-test (known reference counts from chessprogramming.org)
// ============================================================================
function runTests() {
  const suite = [
    ['startpos', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281]],
    ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],
    ['position 3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
    ['position 4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
    ['position 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]],
    ['position 6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079, 89890]],
  ];
  let ok = true;
  for (const [name, fen, expected] of suite) {
    const pos = parseFen(fen);
    expected.forEach((exp, i) => {
      const got = perft(pos, i + 1);
      const pass = got === exp;
      if (!pass) ok = false;
      console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(10)} depth ${i + 1}: ${got}${pass ? '' : '  (expected ' + exp + ')'}`);
    });
  }
  console.log(ok ? '\nAll perft checks passed.' : '\nPERFT FAILURES - do not trust the generator.');
  return ok;
}

// ============================================================================
//  Random numbers (seeded, so runs are reproducible)
// ============================================================================
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(1);
let FLIP_COLORS = false;        // false = every puzzle is White to move
const ri = (n) => Math.floor(rng() * n);
const pick = (a) => a[ri(a.length)];
const chance = (p) => rng() < p;

// ============================================================================
//  Pattern templates
//  Canonical frame: Black king at the TOP, White to move. Files a..h = 0..7,
//  ranks 1..8 = 0..7.  Each template returns { m: Map(square -> piece), ... }.
// ============================================================================
function nb() { return { m: new Map(), ok: true }; }
function put(B, f, r, p) {
  if (f < 0 || f > 7 || r < 0 || r > 7 || B.m.has(r * 8 + f)) { B.ok = false; return; }
  B.m.set(r * 8 + f, p);
}
/** every square on the same rank/file/diagonal as (f,r), ignoring blockers */
function lineSquares(f, r, dirs) {
  const out = [];
  for (const [df, dr] of dirs) {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) { out.push([ff, rr]); ff += df; rr += dr; }
  }
  return out;
}
const ALL8 = DIAG.concat(ORTH);

const PATTERNS = [];
function def(id, piece, name, fn) { PATTERNS.push({ id, piece, name, fn }); }

// ---------------------------------------------------------------- ROOK ----
def('rook-backrank', 'R', 'Back-rank mate', () => {
  const B = nb(), kf = ri(8);
  put(B, kf, 7, 'k');
  for (let df = -1; df <= 1; df++) {
    const f = kf + df;
    if (f >= 0 && f <= 7) put(B, f, 6, chance(0.15) ? pick(['n', 'b']) : 'p');
  }
  let rf; do { rf = ri(8); } while (Math.abs(rf - kf) <= 1);
  put(B, rf, ri(6), 'R');
  B.targets = [[rf, 7]];
  return B;
});

def('rook-ladder', 'R', 'Ladder mate (two heavy pieces)', () => {
  const B = nb(), kf = ri(8);
  put(B, kf, 7, 'k');
  put(B, ri(8), 6, pick(['R', 'R', 'Q']));      // the piece cutting off the 7th rank
  const bf = ri(8);
  put(B, bf, ri(6), 'R');                       // the piece that delivers mate on the 8th
  B.targets = [[bf, 7]];
  return B;
});

def('rook-box', 'R', 'King and rook mate (opposition)', () => {
  const B = nb(), kf = ri(8);
  put(B, kf, 7, 'k');
  put(B, kf + pick([-1, 0, 1]), 5, 'K');
  const rf = ri(8);
  put(B, rf, ri(7), 'R');
  B.targets = [[rf, 7]];
  return B;
});

def('rook-anastasia', 'R', "Anastasia's mate", () => {
  const B = nb();
  put(B, 7, 6, 'k'); put(B, 6, 6, 'p'); put(B, 4, 6, 'N');
  const rr = ri(5);
  put(B, ri(7), rr, 'R');
  B.targets = [[7, rr]];
  return B;
});

def('rook-arabian', 'R', 'Arabian mate', () => {
  const B = nb();
  put(B, 7, 7, 'k'); put(B, 5, 5, 'N');
  put(B, ri(6), 6, 'R');                        // rook comes along the 7th rank
  B.targets = [[7, 6]];
  return B;
});

// --------------------------------------------------------------- QUEEN ----
def('queen-backrank', 'Q', 'Back-rank mate', () => {
  const B = nb(), kf = ri(8);
  put(B, kf, 7, 'k');
  for (let df = -1; df <= 1; df++) {
    const f = kf + df;
    if (f >= 0 && f <= 7) put(B, f, 6, chance(0.15) ? pick(['n', 'b']) : 'p');
  }
  let qf; do { qf = ri(8); } while (Math.abs(qf - kf) <= 1);
  put(B, qf, ri(6), 'Q');
  B.targets = [[qf, 7]];
  return B;
});

def('queen-ladder', 'Q', 'Ladder mate (queen delivers)', () => {
  const B = nb();
  put(B, ri(8), 7, 'k');
  put(B, ri(8), 6, pick(['R', 'Q']));
  const qf = ri(8);
  put(B, qf, ri(6), 'Q');
  B.targets = [[qf, 7]];
  return B;
});

def('queen-king', 'Q', 'King and queen mate', () => {
  const B = nb(), kf = ri(8);
  put(B, kf, 7, 'k');
  put(B, kf + pick([-1, 0, 1]), 5, 'K');
  put(B, ri(8), ri(7), 'Q');
  return B;
});

def('queen-g7-bishop', 'Q', 'Queen mate supported by the long-diagonal bishop', () => {
  const B = nb();
  put(B, 6, 7, 'k'); put(B, 5, 6, 'p'); put(B, 7, 6, 'p');
  const d = ri(5); put(B, d, d, 'B');           // a1..e5
  const cand = lineSquares(6, 6, ALL8).filter(([f, r]) => !(f === r) && r < 6 || (f === 7 && r === 5));
  const [qf, qr] = pick(cand); put(B, qf, qr, 'Q');
  B.targets = [[6, 6]];
  return B;
});

def('queen-g7-support', 'Q', 'Queen kiss in the corner (supported by pawn or knight)', () => {
  const B = nb();
  put(B, 7, 7, 'k');
  if (chance(0.5)) put(B, 7, 6, 'p');
  const sup = pick([[5, 5, 'P'], [7, 5, 'P'], [4, 5, 'N'], [5, 4, 'N'], [7, 4, 'N']]);
  put(B, sup[0], sup[1], sup[2]);
  const [qf, qr] = pick(lineSquares(6, 6, ALL8).filter(([f, r]) => !(f === 7 && r === 7)));
  put(B, qf, qr, 'Q');
  B.targets = [[6, 6]];
  return B;
});

// -------------------------------------------------------------- BISHOP ----
def('bishop-boden', 'B', "Boden's mate", () => {
  const B = nb();
  put(B, 2, 7, 'k');
  put(B, 3, 6, pick(['p', 'p', 'p', 'n', 'b']));
  put(B, 1, 7, 'b');
  put(B, 3, 7, pick(['r', 'q', 'b']));
  put(B, 5, 3, 'B');                            // Bf4 covers c7
  const [f, r] = pick([[5, 0], [4, 1], [3, 2], [2, 3], [1, 4]]); // light bishop heads for a6
  put(B, f, r, 'B');
  B.targets = [[0, 5]];                         // Ba6#
  return B;
});

def('bishop-two', 'B', 'Two bishops and king mate', () => {
  const B = nb();
  put(B, 7, 7, 'k'); put(B, 6, 5, 'K'); put(B, 5, 6, 'B');
  const dark = [];
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if ((f + r) % 2 === 0 && f !== r) dark.push([f, r]);
  const [f, r] = pick(dark); put(B, f, r, 'B');
  B.targets = [0, 1, 2, 3, 4, 5, 6].map((i) => [i, i]);   // mate is given on the long diagonal
  return B;
});

def('bishop-corner', 'B', 'Bishop mate (king boxed in by own pieces)', () => {
  const B = nb();
  put(B, 7, 7, 'k'); put(B, 6, 7, pick(['n', 'b'])); put(B, 7, 6, 'p');
  const dark = [];
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) if ((f + r) % 2 === 0 && f !== r) dark.push([f, r]);
  const [f, r] = pick(dark); put(B, f, r, 'B');
  B.targets = [0, 1, 2, 3, 4, 5, 6].map((i) => [i, i]);
  return B;
});

// -------------------------------------------------------------- KNIGHT ----
def('knight-smothered', 'N', 'Smothered mate', () => {
  const B = nb();
  put(B, 7, 7, 'k'); put(B, 6, 7, pick(['r', 'r', 'n'])); put(B, 6, 6, 'p'); put(B, 7, 6, 'p');
  const [f, r] = pick([[3, 5], [4, 4], [6, 4], [7, 5]]);
  put(B, f, r, 'N');
  B.targets = [[5, 6]];                         // Nf7#
  return B;
});

def('knight-queen-corner', 'N', 'Knight mate (queen covers the corner)', () => {
  const B = nb();
  put(B, 7, 7, 'k'); put(B, 6, 5, 'Q');
  const [f, r] = pick([[3, 5], [4, 4], [6, 4], [7, 5], [3, 7]]);
  put(B, f, r, 'N');
  B.targets = [[5, 6]];
  return B;
});

def('knight-boxed', 'N', 'Knight mate (king boxed in by own pieces)', () => {
  const B = nb(), kf = 1 + ri(6);
  put(B, kf, 7, 'k');
  put(B, kf - 1, 7, pick(['r', 'n'])); put(B, kf + 1, 7, pick(['r', 'n']));
  for (let df = -1; df <= 1; df++) put(B, kf + df, 6, 'p');
  const t = pick([[kf - 2, 6], [kf + 2, 6]]);
  const srcs = KN.map(([df, dr]) => [t[0] + df, t[1] + dr]).filter(([f, r]) => f >= 0 && f <= 7 && r >= 0 && r <= 7);
  const [sf, sr] = pick(srcs); put(B, sf, sr, 'N');
  B.targets = [t];
  return B;
});

// ============================================================================
//  Generator
// ============================================================================
function addFiller(B) {
  const vals = [...B.m.values()];
  const bk = [...B.m.entries()].find(([, p]) => p === 'k')[0];
  if (!vals.includes('K')) {
    for (let t = 0; t < 30; t++) {
      const f = ri(8), r = ri(5), s = r * 8 + f;
      if (B.m.has(s)) continue;
      if (Math.max(Math.abs(f - (bk & 7)), Math.abs(r - (bk >> 3))) < 2) continue;
      B.m.set(s, 'K'); break;
    }
  }
  const nw = pick([0, 0, 1, 2]), nbk = pick([0, 0, 1, 2]);
  for (let i = 0; i < nw; i++) { const s = (1 + ri(4)) * 8 + ri(8); if (!B.m.has(s)) B.m.set(s, 'P'); }          // ranks 2-5
  for (let i = 0; i < nbk; i++) { const s = (3 + ri(4)) * 8 + ri(8); if (!B.m.has(s)) B.m.set(s, 'p'); }          // ranks 4-7
}

function transform(map, mir, flip) {
  const out = new Map();
  for (const [s, p] of map) {
    let f = s & 7, r = s >> 3, q = p;
    if (mir) f = 7 - f;
    if (flip) { r = 7 - r; q = isW(p) ? p.toLowerCase() : p.toUpperCase(); }
    out.set(r * 8 + f, q);
  }
  return out;
}

function buildPosition(map, turn) {
  const b = new Array(64).fill('');
  for (const [s, p] of map) b[s] = p;
  return { b, turn, castle: '', ep: -1 };
}

function legalSetup(pos) {
  let wk = 0, bk = 0;
  for (let s = 0; s < 64; s++) {
    const p = pos.b[s];
    if (p === 'K') wk++; else if (p === 'k') bk++;
    if ((p === 'P' || p === 'p') && ((s >> 3) === 0 || (s >> 3) === 7)) return false;
  }
  if (wk !== 1 || bk !== 1) return false;
  const a = kingSq(pos.b, 'w'), c = kingSq(pos.b, 'b');
  if (Math.max(Math.abs((a & 7) - (c & 7)), Math.abs((a >> 3) - (c >> 3))) < 2) return false;
  if (attacked(pos.b, a, 'b') || attacked(pos.b, c, 'w')) return false;   // nobody starts in check
  return true;
}

function mirrorKey(pos) {
  const b = pos.b.slice();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 4; f++) {
    const x = b[r * 8 + f]; b[r * 8 + f] = b[r * 8 + 7 - f]; b[r * 8 + 7 - f] = x;
  }
  return b.join('|') + pos.turn;
}

function tryPattern(pat, seen) {
  const B = pat.fn();
  if (!B.ok) return null;
  addFiller(B);
  const flip = FLIP_COLORS && chance(0.5), mir = chance(0.5);
  const map = transform(B.m, mir, flip);
  const targetSqs = (B.targets || []).map(([f, r]) => {
    const ff = mir ? 7 - f : f, rr = flip ? 7 - r : r;
    return rr * 8 + ff;
  });
  const pos = buildPosition(map, flip ? 'b' : 'w');
  if (!legalSetup(pos)) return null;
  const key = pos.b.join('|') + pos.turn;
  if (seen.has(key)) return null;
  const moves = genMoves(pos);
  const mates = matingMoves(pos, moves);
  if (mates.length !== 1) return null;                          // exactly one mate in 1
  const m = mates[0];
  const wanted = flip ? pat.piece.toLowerCase() : pat.piece;
  if (m.piece !== wanted) return null;                           // pattern's piece must deliver it
  if (targetSqs.length && !targetSqs.includes(m.to)) return null; // ...and on the pattern's mating square
  seen.add(key); seen.add(mirrorKey(pos));
  return {
    fen: toFen(pos),
    turn: pos.turn === 'w' ? 'white' : 'black',
    pattern: pat.name,
    patternId: pat.id,
    matingPiece: { R: 'rook', Q: 'queen', B: 'bishop', N: 'knight' }[pat.piece],
    solution: { from: sqName(m.from), to: sqName(m.to), uci: sqName(m.from) + sqName(m.to), san: san(pos, m, moves) },
    legalMoves: moves.length,
    checkingMoves: moves.filter((x) => inCheck(make(pos, x))).length,
    pieces: pos.b.filter(Boolean).length,
  };
}

function ascii(fen) {
  const pos = parseFen(fen);
  let s = '';
  for (let r = 7; r >= 0; r--) {
    s += `${r + 1}  ` + [...Array(8).keys()].map((f) => pos.b[r * 8 + f] || '.').join(' ') + '\n';
  }
  return s + '   a b c d e f g h\n';
}

// ============================================================================
//  Runtime API (used by the game page)
// ============================================================================
const PIECE_NAME = { R: 'rook', Q: 'queen', B: 'bishop', N: 'knight' };
const sessionSeen = new Set();
let runtimeSeeded = false;

/**
 * Make one random mate-in-1 puzzle (White to move).
 * opts.piece: 'rook' | 'queen' | 'bishop' | 'knight' | 'any' (default)
 * opts.seed:  optional number for a reproducible puzzle
 * Returns { fen, turn, pattern, patternId, matingPiece, solution:{from,to,uci,san}, ... } or null.
 */
function generate(opts) {
  opts = opts || {};
  if (opts.seed !== undefined) { rng = mulberry32(opts.seed >>> 0); runtimeSeeded = true; }
  else if (!runtimeSeeded) { rng = mulberry32(((Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0)); runtimeSeeded = true; }
  const letters = Object.keys(PIECE_NAME).filter((l) => !opts.piece || opts.piece === 'any' || PIECE_NAME[l] === opts.piece);
  if (!letters.length) return null;
  // Choose the piece and the pattern FIRST, then retry that same pattern until it works.
  // (Re-rolling the pattern after every failed attempt would favour patterns that succeed more often,
  //  e.g. knight mates would crowd out the queen ladder mate.)  Each piece gets an equal share, and
  //  each pattern an equal share within its piece.  If a pattern is used up for this session
  //  (every variation already seen), pick another one.
  for (let round = 0; round < 40; round++) {
    const letter = pick(letters);
    const pat = pick(PATTERNS.filter((p) => p.piece === letter));
    for (let attempt = 0; attempt < 4000; attempt++) {
      const p = tryPattern(pat, sessionSeen);
      if (p) return p;
    }
  }
  return null;
}

// ============================================================================
//  CLI
// ============================================================================
function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : dflt;
}
const has = (n) => process.argv.includes('--' + n);

function main() {
  const fs = require('fs');
  if (has('test')) process.exit(runTests() ? 0 : 1);
  if (has('list')) { PATTERNS.forEach((p) => console.log(p.id.padEnd(22), p.piece, p.name)); process.exit(0); }

  const seed = +arg('seed', 1);
  const perPattern = +arg('per-pattern', 40);
  const maxAttempts = +arg('max-attempts', 60000);
  const out = arg('out', 'puzzles_mate1.json');
  rng = mulberry32(seed);
  FLIP_COLORS = has('mixed');

  const seen = new Set();
  const puzzles = [];
  const report = [];
  for (const pat of PATTERNS) {
    let got = 0, attempts = 0;
    while (got < (has('show') ? 1 : perPattern) && attempts < maxAttempts) {
      attempts++;
      const p = tryPattern(pat, seen);
      if (p) { puzzles.push(p); got++; if (has('show')) console.log(`\n${pat.piece} | ${pat.name}   [${p.turn} to move]  ${p.solution.san}\n${ascii(p.fen)}`); }
    }
    report.push({ id: pat.id, piece: pat.piece, got, attempts });
  }
  puzzles.forEach((p, i) => { p.id = 'M1-' + String(i + 1).padStart(4, '0'); });
  if (!has('show')) {
    fs.writeFileSync(out, JSON.stringify({
      meta: { type: 'mate-in-1', seed, perPattern, count: puzzles.length, whiteToMoveOnly: !FLIP_COLORS, note: 'fen + single mating move (solution). Generated by generate_mate1.js' },
      puzzles,
    }, null, 1));
  }
  console.log('\npattern'.padEnd(24) + 'piece  made  attempts');
  for (const r of report) console.log(r.id.padEnd(23) + r.piece.padEnd(7) + String(r.got).padEnd(6) + r.attempts);
  console.log(`\n${puzzles.length} puzzles${has('show') ? '' : ' -> ' + out}`);
}

const API = { generate, parseFen, toFen, genMoves, make, inCheck, matingMoves, perft, san, PATTERNS };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
  if (require.main === module) main();
}
if (typeof window !== 'undefined') window.Mate1 = API;

})();
