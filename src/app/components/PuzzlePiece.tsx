interface PuzzlePieceProps {
  imageUrl: string;
  userId: string;
  index: number;
}

export function PuzzlePiece({ imageUrl, userId, index }: PuzzlePieceProps) {
  return (
    <div className="group relative aspect-square border border-black bg-white overflow-hidden">
      <img
        src={imageUrl}
        alt={`Puzzle piece ${index + 1}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-2 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
          {userId}
        </span>
      </div>
    </div>
  );
}
