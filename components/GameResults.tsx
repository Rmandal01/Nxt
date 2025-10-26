"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import winnerPic from "@/public/winner-pic.jpg";
import loserPic from "@/public/loser-pic.jpg";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

import MarkdownComponent from "@/components/MarkdownComponent";

export default function GameResults({ gameResults, currentUserId }: { gameResults: any; currentUserId: string | null }) {
  const router = useRouter();
  const [winnerUsername, setWinnerUsername] = useState<string | null>(null);
  const isWinner = currentUserId && gameResults.winner_id === currentUserId;

  // Define a consistent size for the images
  const imageSize = 200;
  
  // Fetch winner's username
  useEffect(() => {
    const fetchWinnerUsername = async () => {
      if (gameResults.winner_id) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', gameResults.winner_id)
          .single();
        
        if (profile) {
          setWinnerUsername(profile.username);
        }
      }
    };
    
    fetchWinnerUsername();
  }, [gameResults.winner_id]);

  // --- AUDIO ---
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const handlePlayReasoning = async () => {
    setIsAudioLoading(true);
    try {
      // 1. Call your new Next.js API route
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: gameResults.judge_reasoning }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audio");
      }

      // 2. Get the audio data as a "blob"
      const audioBlob = await response.blob();

      // 3. Create a temporary URL and play the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      // 4. Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      // Optionally, show an error to the user
    } finally {
      setIsAudioLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        {gameResults.winner_id && (
          <>
            <div className="flex justify-center">
              {isWinner ? (
                <Image
                  src={winnerPic}
                  alt="Winner"
                  width={imageSize}
                  height={imageSize}
                  className={`rounded-full object-cover w-[${imageSize}px] h-[${imageSize}px]`}
                />
              ) : (
                <Image
                  src={loserPic}
                  alt="Loser"
                  width={imageSize}
                  height={imageSize}
                  className={`rounded-full object-cover w-[${imageSize}px] h-[${imageSize}px]`}
                />
              )}
            </div>

            <div>
              {isWinner ? (
                <h1 className="text-5xl font-bold mb-6 text-green-400">🎉 You Won!</h1>
              ) : (
                <h1 className="text-5xl font-bold mb-6">You lost...</h1>
              )}

              <p className="text-xl text-gray-300 mb-6">
                <strong>{winnerUsername ? `${winnerUsername}` : `Player ID: ${gameResults.winner_id}`}</strong> is the winner!
              </p>
            </div>
          </>
        )}
        
        {gameResults.judge_reasoning && (
          <>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Judge's Reasoning</h3>
              <div className="bg-gray-800 p-6 rounded-lg text-left">
                <MarkdownComponent content={gameResults.judge_reasoning} />
              </div>
            </div>

            <Button
              onClick={handlePlayReasoning}
              disabled={isAudioLoading}
              variant="outline"
              size="sm"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isAudioLoading ? "Loading..." : "Play Reasoning"}
            </Button>
          </>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="px-8 py-3"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
