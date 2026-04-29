interface PuzzlePieceProps {
  imageUrl: string;
  userId: string;
  x: number;
  y: number;
  rotation: number;
  index: number;
}

export function PuzzlePiece({ imageUrl, userId, x, y, rotation, index }: PuzzlePieceProps) {
  // Create different puzzle shapes based on index
  const shapes = [
    // Top tab, right tab, bottom tab, left socket
    'M0,40 Q0,20 15,20 Q20,15 25,15 Q30,15 35,20 Q50,20 50,0 L200,0 Q200,20 215,20 Q220,25 220,30 Q220,35 215,40 Q200,50 200,50 L200,200 Q180,200 180,185 Q175,180 170,180 Q165,180 160,185 Q150,200 150,200 L0,200 Q20,200 20,185 Q15,180 10,180 Q5,180 0,185 Q0,170 0,150 Z',
    // Top socket, right socket, bottom tab, left tab
    'M50,0 Q50,20 35,20 Q30,25 30,30 Q30,35 35,40 Q50,50 50,50 L200,50 Q200,70 185,70 Q180,75 180,80 Q180,85 185,90 Q200,100 200,100 L200,200 Q180,200 180,185 Q175,180 170,180 Q165,180 160,185 Q150,200 150,200 L0,200 Q20,200 20,185 Q25,180 30,180 Q35,180 40,185 Q50,200 50,200 Z',
    // Top tab, right socket, bottom socket, left tab
    'M0,50 Q20,50 20,35 Q25,30 30,30 Q35,30 40,35 Q50,50 50,50 L50,0 Q70,0 70,15 Q75,20 80,20 Q85,20 90,15 Q100,0 100,0 L200,0 L200,50 Q180,50 180,65 Q175,70 170,70 Q165,70 160,65 Q150,50 150,50 L150,200 Q130,200 130,185 Q125,180 120,180 Q115,180 110,185 Q100,200 100,200 L0,200 Z',
    // All sockets
    'M50,0 Q50,20 35,20 Q30,25 30,30 Q30,35 35,40 Q50,50 50,50 L200,50 Q200,70 185,70 Q180,75 180,80 Q180,85 185,90 Q200,100 200,100 L200,150 Q180,150 180,165 Q175,170 170,170 Q165,170 160,165 Q150,150 150,150 L0,150 Q20,150 20,135 Q25,130 30,130 Q35,130 40,135 Q50,150 50,150 Z',
  ];

  const clipPath = shapes[index % shapes.length];

  return (
    <div
      className="absolute transition-all hover:scale-105 hover:z-10 cursor-pointer"
      style={{
        left: `${x + 2500}px`,
        top: `${y + 2500}px`,
        transform: `rotate(${rotation}deg)`,
        width: '200px',
        height: '200px',
      }}
    >
      <svg width="200" height="200" className="absolute inset-0">
        <defs>
          <clipPath id={`puzzle-clip-${index}`}>
            <path d={clipPath} />
          </clipPath>
          <filter id={`shadow-${index}`}>
            <feDropShadow dx="4" dy="4" stdDeviation="2" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Shadow outline */}
        <path
          d={clipPath}
          fill="rgba(0,0,0,0.2)"
          transform="translate(4, 4)"
        />

        {/* Main puzzle piece with border */}
        <path
          d={clipPath}
          fill="none"
          stroke="#000"
          strokeWidth="4"
        />

        {/* Image with clip */}
        <image
          href={imageUrl}
          width="200"
          height="200"
          clipPath={`url(#puzzle-clip-${index})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>

      {/* Username label */}
      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <span className="bg-black text-white px-3 py-1 text-xs font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,235,59,1)]">
          {userId}
        </span>
      </div>
    </div>
  );
}
