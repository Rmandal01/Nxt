"use client"

import { useState, useEffect, useRef, FormEvent, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, User, Send, Zap, Target, Brain, X, BookOpen } from "lucide-react"
import { use } from "react"
import { Navigation } from "@/components/navigation"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

function MarkdownComponent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkBreaks]}
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >{content}</Markdown>
  );
}

function AwaitingJudging({ allParticipantsSubmitted, isJudging }: { allParticipantsSubmitted: boolean; isJudging: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold text-gray-400 mb-4">Prompt submitted!</h1>
      {!allParticipantsSubmitted && (
        <>
          <p>We are still waiting for others to submit their prompts...</p>
          <p>Once everyone has submitted, we will automatically start judging.</p>
        </>
      )}
      {allParticipantsSubmitted && !isJudging && (
        <>
          <p>All participants have submitted their prompts!</p>
          <p>Starting the judging process...</p>
        </>
      )}
      {isJudging && (
        <>
          <p className="text-2xl font-bold">Judging in progress...</p>
          <p className="text-lg">Please wait while our AI evaluates your prompts.</p>
        </>
      )}
    </div>
  );
}

function GameResults({ gameResults, currentUserId }: { gameResults: any; currentUserId: string | null }) {
  const router = useRouter();
  const [winnerUsername, setWinnerUsername] = useState<string | null>(null);
  const isWinner = currentUserId && gameResults.winner_id === currentUserId;
  
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
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center max-w-2xl mx-auto">
        {gameResults.winner_id && (
          <div className="mb-8">
            {isWinner ? (
              <h1 className="text-5xl font-bold mb-6 text-green-400">🎉 You Won!</h1>
            ) : (
              <h1 className="text-5xl font-bold mb-6">You lost...</h1>
            )}

            <p className="text-xl text-gray-300 mb-6">
              <strong>{winnerUsername ? `${winnerUsername}` : `Player ID: ${gameResults.winner_id}`}</strong> is the winner!
            </p>
          </div>
        )}
        
        {gameResults.judge_reasoning && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Judge's Reasoning</h3>
            <div className="bg-gray-800 p-6 rounded-lg text-left">
              <MarkdownComponent content={gameResults.judge_reasoning} />
            </div>
          </div>
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

export default function BattleArena({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter();

  const [prompt, setPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes

  const [atBottom, setAtBottom] = useState<boolean>(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai", // So we use the right route, see https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#transport.default-chat-transport
    }),
  });

  const [isFinalSubmitting, setIsFinalSubmitting] = useState<boolean>(false);
  const [isAwaitingJudging, setIsAwaitingJudging] = useState<boolean>(false);
  const [allParticipantsSubmitted, setAllParticipantsSubmitted] = useState<boolean>(false);
  const [isJudging, setIsJudging] = useState<boolean>(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  
  // Game results state
  const [gameResults, setGameResults] = useState<any>(null);
  const [hasGameResults, setHasGameResults] = useState<boolean>(false);
  
  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Deep research state
  const [isResearching, setIsResearching] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [researchResults, setResearchResults] = useState("");

  // Mock data - replace with real backend data
  const battleTopic = "Create a marketing email for a sustainable coffee brand"

  // check in supabase db if you already did submit prompt
  useEffect(() => {
    const fetchParticipant = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: participant } = await supabase.from('game_participants').select('*').eq('user_id', user.id).eq('room_id', roomId).single();
        if (participant && participant.prompt !== null) {
          setIsAwaitingJudging(true);
        }
      }
    };
      fetchParticipant();
  }, [roomId]);

  // Function to check if all participants have submitted and trigger judging
  const checkAllParticipantsSubmitted = useCallback(async () => {
    const supabase = createClient();
    const { data: participants, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId);
      
    if (!error && participants) {
      const allSubmitted = participants.every(p => p.prompt !== null);
      setAllParticipantsSubmitted(allSubmitted);
      
      if (allSubmitted && !isJudging) {
        setIsJudging(true);
      }
    }
  }, [roomId, isJudging, router]);

  // Function to check for game results
  const checkGameResults = useCallback(async () => {
    const supabase = createClient();
    const { data: results, error } = await supabase
      .from('game_results')
      .select('*')
      .eq('room_id', roomId)
      .single();
      
    if (!error && results) {
      setGameResults(results);
      setHasGameResults(true);
    } else if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking game results:', error);
    }
  }, [roomId]);

  // Set up realtime subscription and initial check
  useEffect(() => {
    const supabase = createClient();
    let channel: any;

    // Initial checks
    checkAllParticipantsSubmitted();
    checkGameResults();

    // Set up realtime subscription to listen for participant changes
    channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch participants when changes occur
          checkAllParticipantsSubmitted();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_results',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch game results when changes occur
          checkGameResults();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, checkAllParticipantsSubmitted, checkGameResults]);

  /*
  useEffect(() => {
    if (phase === "prompting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, timeLeft])
  */

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ text: prompt });
    setPrompt("");
    
    if (messagesRef.current) {
      setAtBottom(true); // Just force it
    }
  };

  const handleSubmitFinal = async (prompt: string) => {
    setIsFinalSubmitting(true);
    try {
      const response = await fetch('/api/rooms/submit-prompt', {
        method: 'POST',
        body: JSON.stringify({ roomId, prompt }),
      });

      if (!response.ok) {
        console.error('Error submitting prompt:', await response.json());
        return;
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error submitting prompt:', error);
    } finally {
      setIsFinalSubmitting(false);
      setIsAwaitingJudging(true);
    }
  };

  const handleResearch = async () => {
    setIsResearching(true);
    setShowResearchModal(true);
    setResearchResults("");

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: battleTopic }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch research');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setResearchResults(prev => prev + chunk);
      }
    } catch (error) {
      console.error('Research error:', error);
      setResearchResults('Failed to fetch research. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  // Auto scroll to bottom when new messages come up
  useEffect(() => {
    if (messagesRef.current && atBottom) {
      messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight);
    }
  }, [messages, atBottom]);

  const handleScroll = () => {
    if (messagesRef.current && messagesRef.current.scrollTop + messagesRef.current.clientHeight >= messagesRef.current.scrollHeight) {
      setAtBottom(true);
    } else {
      setAtBottom(false);
    }
  };

  return (
    <>
      <Navigation />

      {hasGameResults ? (
        <GameResults gameResults={gameResults} currentUserId={currentUserId} />
      ) : isAwaitingJudging ? (
        <AwaitingJudging allParticipantsSubmitted={allParticipantsSubmitted} isJudging={isJudging} />
      ) : (
        <div>
          <div className="relative z-10 container mx-auto px-4 py-6">
            {/* Header with timer and players */}
            <div className="mb-6 animate-slide-up">
              <Card className="p-4 glass-effect border-primary/20">
                <div className="flex items-center justify-between">
                  {/* Timer */}
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-3xl font-bold font-mono">{formatTime(timeLeft)}</span>
                    </div>
                    <Progress value={(timeLeft / 180) * 100} className="w-48 h-2" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left sidebar - Topic and tips */}
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                {/* Battle topic */}
                <Card className="p-6 glass-effect border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Battle Topic</h3>
                  </div>
                  <p className="text-2xl text-balance leading-relaxed">{battleTopic}</p>
                  <Button
                    onClick={handleResearch}
                    disabled={isResearching}
                    className="mt-4 w-full"
                    variant="outline"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {isResearching ? "Researching..." : "Deep Research Topic"}
                  </Button>
                </Card>
              </div>

              {/* Main area - Prompt editor */}
              <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <Card className="p-6 glass-effect border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Your Prompt</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {prompt.length} characters
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {prompt.split(/\s+/).filter(Boolean).length} words
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col w-full h-[500px] mx-auto px-4">
                      <div className="overflow-auto px-5 py-6 h-full" ref={messagesRef} onScroll={handleScroll}>
                        {messages.map(message => (
                          <div key={message.id}>
                            {message.parts.map((part, i) => {
                              const messageKey = `${message.id}-${i}`;

                              if (part.type === "text") {
                                if (message.role === 'user') {
                                  return (
                                    <div 
                                      key={messageKey}
                                      className="py-3 flex justify-end"
                                    >
                                      <div className="rounded-full bg-blue-950 p-3 inline">
                                        <MarkdownComponent content={part.text} />
                                      </div>
                                    </div>
                                  );
                                } else { // AI
                                  return (
                                    <div key={messageKey}>
                                      <MarkdownComponent content={part.text} />
                                      
                                      <Button
                                        variant="outline"
                                        className="mt-2 cursor-pointer"
                                        onClick={() => handleSubmitFinal(part.text)}
                                        disabled={isFinalSubmitting}
                                      >
                                        {isFinalSubmitting ? "Submitting..." : "Submit Final"}
                                      </Button>
                                    </div>
                                  );
                                }
                              }
                            })}
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={handleSubmit}
                        className="grow flex"
                      >
                        <input
                          className="dark:bg-zinc-900 w-full border border-zinc-300 dark:border-zinc-800 outline-none rounded shadow-xl p-3"
                          value={prompt}
                          ref={inputRef}
                          placeholder="Say something..."
                          onChange={e => setPrompt(e.currentTarget.value)}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="px-6 py-7"
                        >{/* 6 7 haha */}
                          <Send className="w-5 h-5" />
                        </Button>
                      </form>
                    </div>
                  </div>

                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Research Modal */}
      {showResearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Deep Research Results</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResearchModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              {researchResults ? (
                <div className="prose prose-invert max-w-none">
                  <MarkdownComponent content={researchResults} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading research...</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
