import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface UsernamePromptProps {
  onUsernameSet: (username: string) => void;
}

export function UsernamePrompt({ onUsernameSet }: UsernamePromptProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    const trimmed = username.trim();
    if (trimmed && trimmed.length >= 2 && trimmed.length <= 20) {
      localStorage.setItem('puzzleUsername', trimmed);
      onUsernameSet(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-8">
      <div className="bg-[#ffeb3b] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
        <h2 className="text-4xl font-black mb-4 text-center transform -rotate-2">
          KULLANICI ADI
        </h2>
        <p className="text-lg font-bold mb-6 text-center">
          Puzzle'da görünecek adınızı girin
        </p>
        <Input
          placeholder="Adınız (2-20 karakter)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 border-4 border-black text-lg font-bold p-4"
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={!username.trim() || username.trim().length < 2}
          className="w-full bg-[#ff5722] hover:bg-[#e64a19] text-white font-black text-xl py-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          DEVAM ET
        </Button>
      </div>
    </div>
  );
}
