import { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PuzzlePiece as PuzzlePieceComponent } from './PuzzlePiece';

interface PuzzlePiece {
  id: string;
  userId: string;
  imageUrl: string;
  x: number;
  y: number;
  rotation: number;
  addedAt: number;
}

interface PuzzleCanvasProps {
  pieces: PuzzlePiece[];
}

export function PuzzleCanvas({ pieces }: PuzzleCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full h-full bg-[#fef9f3] overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.1 }}
        panning={{ disabled: false }}
      >
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass="w-full h-full"
        >
          <div
            ref={canvasRef}
            className="relative"
            style={{
              width: '5000px',
              height: '5000px',
              transform: 'translate(-2500px, -2500px)',
            }}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />

            {/* Puzzle pieces */}
            {pieces.map((piece, index) => (
              <PuzzlePieceComponent
                key={piece.id}
                imageUrl={piece.imageUrl}
                userId={piece.userId}
                x={piece.x}
                y={piece.y}
                rotation={piece.rotation}
                index={index}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
