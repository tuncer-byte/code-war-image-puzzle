import { useState, useEffect, useRef } from 'react';
import { SessionCreator } from './components/SessionCreator';
import { PuzzleCanvas } from './components/PuzzleCanvas';
import { PieceAdder } from './components/PieceAdder';
import { UsernamePrompt } from './components/UsernamePrompt';
import { Button } from './components/ui/button';
import { Copy, Users, LogOut } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface PuzzlePiece {
  id: string;
  userId: string;
  imageUrl: string;
  x: number;
  y: number;
  rotation: number;
  addedAt: number;
}

interface Session {
  id: string;
  name: string;
  createdAt: number;
}

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('puzzleUsername'));
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [copied, setCopied] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-938109ab`;

  useEffect(() => {
    if (sessionId) {
      loadSession();
      loadPieces();

      // Poll for new pieces every 2 seconds
      pollIntervalRef.current = window.setInterval(() => {
        loadPieces();
      }, 2000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`${serverUrl}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadPieces = async () => {
    try {
      const response = await fetch(`${serverUrl}/sessions/${sessionId}/pieces`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPieces(data.pieces || []);
      }
    } catch (error) {
      console.error('Error loading pieces:', error);
    }
  };

  const handleCreateSession = async (newSessionId: string) => {
    try {
      const response = await fetch(`${serverUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          name: 'Divizyon Puzzle',
        }),
      });

      if (response.ok) {
        setSessionId(newSessionId);
      } else {
        alert('Oyun oluşturulamadı!');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Oyun oluşturulamadı!');
    }
  };

  const handleJoinSession = async (joinSessionId: string) => {
    try {
      const response = await fetch(`${serverUrl}/sessions/${joinSessionId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        setSessionId(joinSessionId);
      } else {
        alert('Oyun bulunamadı!');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Oyuna katılınamadı!');
    }
  };

  const handleCopyCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    setSessionId(null);
    setSession(null);
    setPieces([]);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  if (!username) {
    return <UsernamePrompt onUsernameSet={setUsername} />;
  }

  if (!sessionId) {
    return (
      <SessionCreator
        onSessionCreated={handleCreateSession}
        onSessionJoin={handleJoinSession}
      />
    );
  }

  return (
    <div className="size-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between">
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-3">
          <h2 className="text-2xl font-black transform -rotate-1">
            {session?.name || 'DIVIZYON PUZZLE'}
          </h2>
        </div>

        <div className="flex gap-4">
          <div className="bg-[#ffeb3b] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="font-black text-lg">{Math.min(pieces.length, 16)}/16 PARÇA</span>
          </div>

          <Button
            onClick={handleCopyCode}
            className="bg-[#2196f3] hover:bg-[#1976d2] text-white font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6"
          >
            <Copy className="w-5 h-5 mr-2" />
            {copied ? 'KOPYALANDI!' : `KOD: ${sessionId}`}
          </Button>

          <Button
            onClick={handleLeave}
            className="bg-[#f44336] hover:bg-[#d32f2f] text-white font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <PuzzleCanvas pieces={pieces} />

      {/* Piece Adder */}
      <PieceAdder
        sessionId={sessionId}
        userId={username}
        onPieceAdded={loadPieces}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
      />

      {/* User ID Badge */}
      <div className="absolute bottom-8 right-8 bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,235,59,1)] px-4 py-2">
        <span className="font-black text-sm">SEN: {username}</span>
      </div>
    </div>
  );
}