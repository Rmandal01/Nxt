"use client";
import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Lightbulb,
  Target,
  Sparkles,
  Brain,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ParticipantScore {
  participant_id: string;
  creativity_score: number;
  effectiveness_score: number;
  clarity_score: number;
  originality_score: number;
  total_score: number;
  feedback: string;
  user_id?: string;
  username?: string;
}

interface GameResultsProps {
  gameResults: {
    winner_id: string;
    judge_reasoning: string;
    scores: ParticipantScore[];
  };
  currentUserId: string;
}

export function GameResults({ gameResults, currentUserId }: GameResultsProps) {
  const router = useRouter();
  const isWinner = gameResults.winner_id === currentUserId;

  // --- ADD THIS CODE BLOCK ---
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
  // --- END OF ADDED CODE BLOCK ---

  // Sort scores by total score (highest first), handle undefined/null scores
  const sortedScores = gameResults.scores
    ? [...gameResults.scores].sort((a, b) => b.total_score - a.total_score)
    : [];

  // Detect if this is an old mock result
  const isOldMockResult =
    gameResults.judge_reasoning?.includes("randomly selected");

  // Override reasoning for old mock results
  const displayReasoning = isOldMockResult
    ? "This game used the old judging system. Please start a new game to see the enhanced AI judging with detailed criteria scores!"
    : gameResults.judge_reasoning;

  const getCriteriaIcon = (criteria: string) => {
    switch (criteria) {
      case "creativity":
        return <Lightbulb className="w-4 h-4" />;
      case "effectiveness":
        return <Target className="w-4 h-4" />;
      case "clarity":
        return <Star className="w-4 h-4" />;
      case "originality":
        return <Sparkles className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getCriteriaColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    if (score >= 4) return "text-orange-500";
    return "text-red-500";
  };
  // Define a consistent size for the images
  const imageSize = 200;
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Winner Announcement */}
          <Card
            className={`p-8 glass-effect border-2 ${isWinner ? "border-yellow-500 bg-yellow-500/10" : "border-primary/20"}`}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {isWinner ? (
                  <Image
                    src="/winner-pic.jpg"
                    alt="Winner"
                    width={imageSize}
                    height={imageSize}
                    className={`rounded-full object-cover w-[${imageSize}px] h-[${imageSize}px]`}
                  />
                ) : (
                  <Image
                    src="/loser-pic.jpg"
                    alt="Loser"
                    width={imageSize}
                    height={imageSize}
                    className={`rounded-full object-cover w-[${imageSize}px] h-[${imageSize}px]`}
                  />
                )}
              </div>
              <div className="flex justify-center">
                <Trophy
                  className={`w-16 h-16 ${isWinner ? "text-yellow-500" : "text-primary"}`}
                />
              </div>
              <h1 className="text-4xl font-bold">
                {isWinner ? "🎉 You Won! 🎉" : "Battle Complete!"}
              </h1>
              <p className="text-xl text-muted-foreground">
                {displayReasoning}
              </p>

              <Button
                onClick={handlePlayReasoning}
                disabled={isAudioLoading}
                variant="outline"
                size="sm"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isAudioLoading ? "Loading..." : "Play Reasoning"}
              </Button>
            </div>
          </Card>

          {/* Participant Scores */}
          {sortedScores.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Detailed Scores</h2>

              {sortedScores.map((score, index) => {
                const isCurrentUser = score.user_id === currentUserId;
                const isWinnerCard = score.user_id === gameResults.winner_id;

                return (
                  <Card
                    key={score.participant_id}
                    className={`p-6 glass-effect ${
                      isWinnerCard
                        ? "border-2 border-yellow-500 bg-yellow-500/5"
                        : "border-primary/20"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={index === 0 ? "default" : "outline"}
                            className="text-lg px-3 py-1"
                          >
                            #{index + 1}
                          </Badge>
                          <h3 className="text-xl font-semibold">
                            {isCurrentUser ? "You" : `Participant ${index + 1}`}
                          </h3>
                          {isWinnerCard && (
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {score.total_score}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            / 40 points
                          </div>
                        </div>
                      </div>

                      {/* Criteria Scores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCriteriaIcon("creativity")}
                            <span className="text-sm font-medium">
                              Creativity
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={score.creativity_score * 10}
                              className="flex-1"
                            />
                            <span
                              className={`text-sm font-bold ${getCriteriaColor(score.creativity_score)}`}
                            >
                              {score.creativity_score}/10
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCriteriaIcon("effectiveness")}
                            <span className="text-sm font-medium">
                              Effectiveness
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={score.effectiveness_score * 10}
                              className="flex-1"
                            />
                            <span
                              className={`text-sm font-bold ${getCriteriaColor(score.effectiveness_score)}`}
                            >
                              {score.effectiveness_score}/10
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCriteriaIcon("clarity")}
                            <span className="text-sm font-medium">Clarity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={score.clarity_score * 10}
                              className="flex-1"
                            />
                            <span
                              className={`text-sm font-bold ${getCriteriaColor(score.clarity_score)}`}
                            >
                              {score.clarity_score}/10
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCriteriaIcon("originality")}
                            <span className="text-sm font-medium">
                              Originality
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={score.originality_score * 10}
                              className="flex-1"
                            />
                            <span
                              className={`text-sm font-bold ${getCriteriaColor(score.originality_score)}`}
                            >
                              {score.originality_score}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="pt-4 border-t border-primary/20">
                        <div className="flex items-start gap-2 mb-2">
                          <Brain className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                          <h4 className="text-sm font-semibold">
                            {isWinnerCard ? "Why You Won" : "Judge's Feedback"}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {score.feedback}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 glass-effect border-primary/20">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">AI Judging Complete</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  The winner was selected by our AI judge based on multiple
                  criteria including creativity, effectiveness, clarity, and
                  originality. To see the detailed score breakdown for each
                  criterion, please run the database migration to enable the
                  enhanced judging system.
                </p>
                <div className="pt-4 text-sm text-muted-foreground italic">
                  See the migration file at:{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    supabase/migrations/add_judging_criteria.sql
                  </code>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/")} variant="outline">
              Back to Home
            </Button>
            <Button onClick={() => router.push("/leaderboard")}>
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
