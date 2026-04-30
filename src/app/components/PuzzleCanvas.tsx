import { useState } from 'react';

interface PuzzlePieceData {
  id: string;
  userId: string;
  imageUrl: string;
  addedAt: number;
}

interface PuzzleCanvasProps {
  pieces: PuzzlePieceData[];
}

const P = 140;   // piece size px
const T = 18;    // tab protrusion px
const G = 4;     // grid size

// SVG canvas dimensions (padding T on each side so edge images don't clip)
const SVG_W = G * P + 2 * T;
const SVG_H = G * P + 2 * T;

// Horizontal connections: CONN_H[row][col] = 1 means piece(row,col) has tab on right
const CONN_H: number[][] = [
  [ 1, -1,  1],
  [-1,  1, -1],
  [ 1, -1,  1],
  [-1,  1, -1],
];

// Vertical connections: CONN_V[row][col] = 1 means piece(row,col) has tab on bottom
const CONN_V: number[][] = [
  [ 1, -1,  1, -1],
  [-1,  1, -1,  1],
  [ 1, -1,  1, -1],
];

function getConn(row: number, col: number) {
  return {
    top:    row > 0   ? -CONN_V[row - 1][col] : 0,
    right:  col < G-1 ?  CONN_H[row][col]     : 0,
    bottom: row < G-1 ?  CONN_V[row][col]     : 0,
    left:   col > 0   ? -CONN_H[row][col - 1] : 0,
  };
}

// Horizontal edge from (xa,y) to (xb,y). bump>0 goes down, bump<0 goes up.
function eH(xa: number, xb: number, y: number, bump: number): string {
  if (!bump) return `L ${xb} ${y}`;
  const d = xa < xb ? 1 : -1;
  const len = Math.abs(xb - xa);
  const mid = (xa + xb) / 2;
  const a = xa + d * len * 0.35;
  const b = xb - d * len * 0.35;
  return (
    `L ${a} ${y} ` +
    `C ${a} ${y + bump * 0.5} ${mid - d * len * 0.07} ${y + bump} ${mid} ${y + bump} ` +
    `C ${mid + d * len * 0.07} ${y + bump} ${b} ${y + bump * 0.5} ${b} ${y} ` +
    `L ${xb} ${y}`
  );
}

// Vertical edge from (x,ya) to (x,yb). bump>0 goes right, bump<0 goes left.
function eV(ya: number, yb: number, x: number, bump: number): string {
  if (!bump) return `L ${x} ${yb}`;
  const d = ya < yb ? 1 : -1;
  const len = Math.abs(yb - ya);
  const mid = (ya + yb) / 2;
  const a = ya + d * len * 0.35;
  const b = yb - d * len * 0.35;
  return (
    `L ${x} ${a} ` +
    `C ${x + bump * 0.5} ${a} ${x + bump} ${mid - d * len * 0.07} ${x + bump} ${mid} ` +
    `C ${x + bump} ${mid + d * len * 0.07} ${x + bump * 0.5} ${b} ${x} ${b} ` +
    `L ${x} ${yb}`
  );
}

function buildPath(row: number, col: number): string {
  const { top, right, bottom, left } = getConn(row, col);
  // Convert connection type to bump direction:
  // top=1 → tab sticks up (bump = -T), top=-1 → blank dips down (bump = +T)
  const tB = top    === 1 ? -T : top    === -1 ?  T : 0;
  const rB = right  === 1 ?  T : right  === -1 ? -T : 0;
  const bB = bottom === 1 ?  T : bottom === -1 ? -T : 0;
  const lB = left   === 1 ? -T : left   === -1 ?  T : 0;
  return `M 0 0 ${eH(0, P, 0, tB)} ${eV(0, P, P, rB)} ${eH(P, 0, P, bB)} ${eV(P, 0, 0, lB)} Z`;
}

export function PuzzleCanvas({ pieces }: PuzzleCanvasProps) {
  const [selected, setSelected] = useState<PuzzlePieceData | null>(null);

  const sorted = [...pieces].sort((a, b) => a.addedAt - b.addedAt).slice(0, 16);
  const slots = Array.from({ length: 16 }, (_, i) => sorted[i] ?? null);

  return (
    <div className="w-full h-full bg-[#fef9f3] flex items-center justify-center overflow-auto p-6">
      <div className="shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{
            display: 'block',
            width: 'min(82vw, 82vh)',
            maxWidth: '620px',
            height: 'auto',
          }}
        >
          <defs>
            {slots.map((_, i) => {
              const row = Math.floor(i / G);
              const col = i % G;
              return (
                <clipPath key={i} id={`cp-${row}-${col}`}>
                  <path
                    d={buildPath(row, col)}
                    transform={`translate(${T + col * P} ${T + row * P})`}
                  />
                </clipPath>
              );
            })}
          </defs>

          {slots.map((piece, i) => {
            const row = Math.floor(i / G);
            const col = i % G;
            const tx = T + col * P;
            const ty = T + row * P;
            const path = buildPath(row, col);

            return (
              <g key={i}>
                {piece ? (
                  <>
                    {/* Image clipped to jigsaw shape */}
                    <image
                      href={piece.imageUrl}
                      x={col * P}
                      y={row * P}
                      width={P + 2 * T}
                      height={P + 2 * T}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#cp-${row}-${col})`}
                    />
                    {/* Outline stroke */}
                    <path
                      d={path}
                      transform={`translate(${tx} ${ty})`}
                      fill="none"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Transparent click target */}
                    <path
                      d={path}
                      transform={`translate(${tx} ${ty})`}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(piece)}
                    >
                      <title>{piece.userId}</title>
                    </path>
                  </>
                ) : (
                  /* Empty slot placeholder */
                  <path
                    d={path}
                    transform={`translate(${tx} ${ty})`}
                    fill="#ede8e0"
                    stroke="#bbb"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Zoom modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-4 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selected.imageUrl}
              alt="Puzzle parçası"
              className="w-full aspect-square object-cover border-2 border-black"
            />
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="font-black text-lg uppercase">{selected.userId}</span>
              <span className="text-sm text-gray-500">tarafından eklendi</span>
            </div>
            <button
              className="mt-3 w-full bg-black text-white font-black py-3 border-4 border-black hover:bg-gray-800 transition-colors"
              onClick={() => setSelected(null)}
            >
              KAPAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
