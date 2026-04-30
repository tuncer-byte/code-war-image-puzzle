import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { Button } from './ui/button';

interface PuzzlePieceData {
  id: string;
  userId: string;
  imageUrl: string;
  addedAt: number;
}

interface PuzzleCanvasProps {
  pieces: PuzzlePieceData[];
}

const P = 140;
const T = 18;
const G = 4;
const SVG_W = G * P + 2 * T;
const SVG_H = G * P + 2 * T;

const CONN_H: number[][] = [
  [ 1, -1,  1],
  [-1,  1, -1],
  [ 1, -1,  1],
  [-1,  1, -1],
];

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
  const tB = top    === 1 ? -T : top    === -1 ?  T : 0;
  const rB = right  === 1 ?  T : right  === -1 ? -T : 0;
  const bB = bottom === 1 ?  T : bottom === -1 ? -T : 0;
  const lB = left   === 1 ? -T : left   === -1 ?  T : 0;
  return `M 0 0 ${eH(0, P, 0, tB)} ${eV(0, P, P, rB)} ${eH(P, 0, P, bB)} ${eV(P, 0, 0, lB)} Z`;
}

export function PuzzleCanvas({ pieces }: PuzzleCanvasProps) {
  const [selected, setSelected] = useState<PuzzlePieceData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const sorted = [...pieces].sort((a, b) => a.addedAt - b.addedAt).slice(0, 16);
  const slots = Array.from({ length: 16 }, (_, i) => sorted[i] ?? null);
  const isComplete = sorted.length === 16;

  const handleDownload = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setDownloading(true);

    try {
      // Clone SVG and inline all images as base64 data URLs to allow canvas export
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      const imgEls = Array.from(clone.querySelectorAll('image'));

      await Promise.all(
        imgEls.map(async (imgEl) => {
          const href = imgEl.getAttribute('href');
          if (!href) return;
          try {
            const res = await fetch(href, { mode: 'cors' });
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            imgEl.setAttribute('href', dataUrl);
          } catch {
            // keep original href on CORS failure
          }
        })
      );

      const svgString = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = SVG_W * scale;
        canvas.height = SVG_H * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'divizyon-puzzle.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
          setDownloading(false);
        });
      };
      img.onerror = () => {
        // Fallback: download as SVG
        const a = document.createElement('a');
        a.href = svgUrl;
        a.download = 'divizyon-puzzle.svg';
        a.click();
        URL.revokeObjectURL(svgUrl);
        setDownloading(false);
      };
      img.src = svgUrl;
    } catch {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#fef9f3] relative overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.25}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.08 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px 100px',
              }}
            >
              <div className="shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  width={SVG_W}
                  height={SVG_H}
                  style={{ display: 'block' }}
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
                            <image
                              href={piece.imageUrl}
                              x={col * P}
                              y={row * P}
                              width={P + 2 * T}
                              height={P + 2 * T}
                              preserveAspectRatio="xMidYMid slice"
                              clipPath={`url(#cp-${row}-${col})`}
                            />
                            <path
                              d={path}
                              transform={`translate(${tx} ${ty})`}
                              fill="none"
                              stroke="rgba(0,0,0,0.28)"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
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
                          <path
                            d={path}
                            transform={`translate(${tx} ${ty})`}
                            fill="#ede8e0"
                            stroke="#c8c0b8"
                            strokeWidth="1"
                            strokeDasharray="5 3"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </TransformComponent>

            {/* Zoom controls — bottom left, above PieceAdder */}
            <div className="absolute bottom-8 left-8 z-40 flex gap-2">
              <Button
                onClick={() => zoomIn()}
                className="bg-white hover:bg-gray-100 text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-11 h-11 p-0"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => zoomOut()}
                className="bg-white hover:bg-gray-100 text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-11 h-11 p-0"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => resetTransform()}
                className="bg-white hover:bg-gray-100 text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-11 h-11 p-0"
                title="Sıfırla"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {isComplete && (
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-[#4caf50] hover:bg-[#45a049] text-white font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 h-11 gap-2"
                  title="Puzzle'ı İndir"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? 'İNDİRİLİYOR...' : 'İNDİR'}
                </Button>
              )}
            </div>
          </>
        )}
      </TransformWrapper>

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
