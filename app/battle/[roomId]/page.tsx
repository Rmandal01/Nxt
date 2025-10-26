"use client"

import { useState, useEffect, useRef, FormEvent, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Send, Target, X, BookOpen } from "lucide-react"
import { use } from "react"
import { Navigation } from "@/components/navigation"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { notFound } from "next/navigation"

import MarkdownComponent from "@/components/MarkdownComponent"
import GameResults from "@/components/GameResults"

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



export default function BattleArena({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter();

  const [prompt, setPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes

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

  const [atBottom, setAtBottom] = useState<boolean>(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Model selection state
  const [selectedModel, setSelectedModel] = useState("gemini");

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
    }),
  });

  // Available models
  const availableModels = [
    { id: "gemini", name: "Gemini 2.0 Flash", provider: "Google" },
    { id: "claude", name: "Claude Sonnet 4.5", provider: "Anthropic"},
    { id: "gpt", name: "GPT-4o Mini", provider: "OpenAI"},
  ];

  // Mock data - replace with real backend data
  const battleTopic = "Create a marketing email for a sustainable coffee brand"

  useEffect(() => {
    const fetchParticipant = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: participant } = await supabase.from('game_participants').select('*').eq('user_id', user.id).eq('room_id', roomId).single();

        // get topic from roomId
        const { data: room } = await supabase.from('game_rooms').select('topic').eq('id', roomId).single();
        if (room && room.topic) {
          setTopic(room.topic);
        } else {
          // What are you doing here?
          return notFound();
        }

        // check in supabase db if you already did submit prompt
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
      .maybeSingle();

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

    sendMessage({ text: prompt }, { body: { model: selectedModel } });
    setPrompt("");

    if (messagesRef.current) {
      setAtBottom(true);
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
        <GameResults gameResults={gameResults} currentUserId={currentUserId || ""} />
      ) : isAwaitingJudging ? (
        <AwaitingJudging allParticipantsSubmitted={allParticipantsSubmitted} isJudging={isJudging} />
      ) : (
        <div>
          <div className="relative z-10 container mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left sidebar - Topic and tips */}
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                {/* Battle topic */}
                <Card className="p-6 glass-effect border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Topic</h3>
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
                      {/* Model Selector */}
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1 text-xs bg-background border border-primary/20 rounded-md cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}> {model.name}
                          </option>
                        ))}
                      </select>
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
