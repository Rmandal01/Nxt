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
import ScoreBreakdown from "@/components/ScoreBreakdown";

interface ParticipantScore {
  participant_id: string;
  creativity_score: number;
  effectiveness_score: number;
  clarity_score: number;
  originality_score: number;
  total_score: number;
  feedback: string;
}

export default function GameResults({ gameResults, currentUserId }: { gameResults: any; currentUserId: string | null }) {
  const router = useRouter();
  const [winnerUsername, setWinnerUsername] = useState<string | null>(null);
  const [userScore, setUserScore] = useState<ParticipantScore | null>(null);
  const isWinner = currentUserId && gameResults.winner_id === currentUserId;

  // Define a consistent size for the images
  const imageSize = 200;
  
  // Generate random scores for demo and fetch winner's username
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch winner's username
      if (gameResults.winner_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', gameResults.winner_id)
          .single();

        if (profile) {
          setWinnerUsername(profile.username);
        }
      }

      // Generate random scores for demo
      if (currentUserId) {
        // Generate realistic scores based on whether user won or lost
        const baseScore = isWinner ? 7 : 5; // Winners get higher base scores
        const variance = 2;

        const creativity = Math.max(0, Math.min(10, Math.floor(baseScore + Math.random() * variance)));
        const effectiveness = Math.max(0, Math.min(10, Math.floor(baseScore + Math.random() * variance)));
        const clarity = Math.max(0, Math.min(10, Math.floor(baseScore + Math.random() * variance)));
        const originality = Math.max(0, Math.min(10, Math.floor(baseScore + Math.random() * variance)));

        const total = creativity + effectiveness + clarity + originality;

        const mockScore: ParticipantScore = {
          participant_id: 'demo',
          creativity_score: creativity,
          effectiveness_score: effectiveness,
          clarity_score: clarity,
          originality_score: originality,
          total_score: total,
          feedback: isWinner
            ? `Excellent work! Your prompt demonstrated strong creativity and clear structure. The approach was both effective and original, showing deep understanding of the topic. Keep up the great work!`
            : `Good effort! Your prompt showed promise with some creative elements. To improve, focus on making your prompts more specific and structured. Consider adding more context to enhance effectiveness.`
        };

        setUserScore(mockScore);
        console.log('Demo score generated:', mockScore);
      }
    };

    fetchData();
  }, [gameResults.winner_id, currentUserId, isWinner]);

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
                <strong>{winnerUsername}</strong> is the winner!
              </p>
            </div>
          </>
        )}

        {userScore && (
          <div className="my-8">
            <ScoreBreakdown
              creativity_score={userScore.creativity_score}
              effectiveness_score={userScore.effectiveness_score}
              clarity_score={userScore.clarity_score}
              originality_score={userScore.originality_score}
              total_score={userScore.total_score}
              feedback={userScore.feedback}
            />
          </div>
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
