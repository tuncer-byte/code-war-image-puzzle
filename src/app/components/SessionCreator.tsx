import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SessionCreatorProps {
  onSessionCreated: (sessionId: string) => void;
  onSessionJoin: (sessionId: string) => void;
}

export function SessionCreator({ onSessionCreated, onSessionJoin }: SessionCreatorProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [sessionName, setSessionName] = useState('');
  const [joinSessionId, setJoinSessionId] = useState('');

  const handleCreate = () => {
    if (sessionName.trim()) {
      // Generate a simple session ID
      const sessionId = Math.random().toString(36).substring(2, 10);
      onSessionCreated(sessionId);
    }
  };

  const handleJoin = () => {
    if (joinSessionId.trim()) {
      onSessionJoin(joinSessionId);
    }
  };

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fef9f3] p-8">
        <div className="bg-[#ffeb3b] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-lg">
          <h1 className="text-6xl font-black mb-4 text-center transform -rotate-2">
            PUZZLE PARTY
          </h1>
          <p className="text-xl font-bold mb-8 text-center">
            Multiplayer sonsuz canvas puzzle oyunu!
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => setMode('create')}
              className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-black text-xl py-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              YENİ OYUN OLUŞTUR
            </Button>
            <Button
              onClick={() => setMode('join')}
              className="bg-[#4caf50] hover:bg-[#45a049] text-white font-black text-xl py-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              OYUNA KATIL
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fef9f3] p-8">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-lg w-full">
          <h2 className="text-4xl font-black mb-6 transform -rotate-1">
            YENİ OYUN
          </h2>
          <Input
            placeholder="Oyun adı girin..."
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="mb-4 border-4 border-black text-lg font-bold p-4"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-4">
            <Button
              onClick={handleCreate}
              disabled={!sessionName.trim()}
              className="flex-1 bg-[#ff5722] hover:bg-[#e64a19] text-white font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              OLUŞTUR
            </Button>
            <Button
              onClick={() => setMode('menu')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              GERİ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fef9f3] p-8">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-lg w-full">
          <h2 className="text-4xl font-black mb-6 transform rotate-1">
            OYUNA KATIL
          </h2>
          <Input
            placeholder="Oyun kodu girin..."
            value={joinSessionId}
            onChange={(e) => setJoinSessionId(e.target.value)}
            className="mb-4 border-4 border-black text-lg font-bold p-4"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <div className="flex gap-4">
            <Button
              onClick={handleJoin}
              disabled={!joinSessionId.trim()}
              className="flex-1 bg-[#4caf50] hover:bg-[#45a049] text-white font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              KATIL
            </Button>
            <Button
              onClick={() => setMode('menu')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              GERİ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
