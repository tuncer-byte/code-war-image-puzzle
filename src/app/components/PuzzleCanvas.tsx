import { useRef } from 'react';
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
  const displayPieces = [...pieces]
    .sort((first, second) => first.addedAt - second.addedAt)
    .slice(0, 9);

  return (
    <div className="w-full h-full bg-[#fef9f3] overflow-auto flex items-center justify-center p-6">
      <div
        ref={canvasRef}
        className="grid gap-0 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
        style={{
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          width: 'min(84vw, 720px)',
          aspectRatio: '1 / 1',
        }}
      >
        {displayPieces.map((piece, index) => (
          <PuzzlePieceComponent
            key={piece.id}
            imageUrl={piece.imageUrl}
            userId={piece.userId}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
