import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Upload, Clock, Plus } from 'lucide-react';

interface PieceAdderProps {
  sessionId: string;
  userId: string;
  onPieceAdded: () => void;
  projectId: string;
  publicAnonKey: string;
}

export function PieceAdder({ sessionId, userId, onPieceAdded, projectId, publicAnonKey }: PieceAdderProps) {
  const [uploading, setUploading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-938109ab`;

  useEffect(() => {
    checkCooldown();

    // Poll cooldown every second
    intervalRef.current = window.setInterval(() => {
      checkCooldown();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, userId]);

  const checkCooldown = async () => {
    try {
      const response = await fetch(
        `${serverUrl}/sessions/${sessionId}/cooldown/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setCooldown(data.remainingSeconds || 0);
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${serverUrl}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Resim yüklenirken hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPiece = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(`${serverUrl}/sessions/${sessionId}/pieces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId,
          imageUrl,
          x: position.x + (Math.random() - 0.5) * 200,
          y: position.y + (Math.random() - 0.5) * 200,
          rotation: (Math.random() - 0.5) * 20,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          alert(`Lütfen ${error.remainingSeconds} saniye bekleyin!`);
          return;
        }
        throw new Error('Failed to add piece');
      }

      setImageUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onPieceAdded();
      checkCooldown();
    } catch (error) {
      console.error('Error adding piece:', error);
      alert('Puzzle eklenirken hata oluştu!');
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 min-w-[400px]">
        {cooldown > 0 ? (
          <div className="flex items-center justify-center gap-3 text-xl font-black">
            <Clock className="w-6 h-6" />
            <span>BEKLEME: {cooldown}s</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!imageUrl ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#2196f3] hover:bg-[#1976d2] text-white font-black text-lg py-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full"
                >
                  {uploading ? (
                    'YÜKLENİYOR...'
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mr-2" />
                      RESİM YÜKLE
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="relative border-4 border-black">
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddPiece}
                    className="flex-1 bg-[#4caf50] hover:bg-[#45a049] text-white font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    EKLE
                  </Button>
                  <Button
                    onClick={() => {
                      setImageUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-black font-black text-lg py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    İPTAL
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
