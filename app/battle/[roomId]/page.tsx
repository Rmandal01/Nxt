"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, User, Send, Zap, Target, Brain, X } from "lucide-react"
import { use } from "react"
import { Navigation } from "@/components/navigation"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

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

export default function BattleArena({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const [prompt, setPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [phase, setPhase] = useState<"waiting" | "prompting" | "testing" | "results">("prompting")
  const [showTips, setShowTips] = useState(false)
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const [testOutput, setTestOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const [atBottom, setAtBottom] = useState<boolean>(true);

  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai", // So we use the right route, see https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#transport.default-chat-transport
    }),
  });

  // Mock data - replace with real backend data
  const battleTopic = "Create a marketing email for a sustainable coffee brand"
  const player1 = { name: "You", score: 0, ready: false }
  const player2 = { name: "Opponent", score: 0, ready: true }

  useEffect(() => {
    if (phase === "prompting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, timeLeft])

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

      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 container mx-auto px-4 py-6">
          {/* Header with timer and players */}
          <div className="mb-6 animate-slide-up">
            <Card className="p-4 glass-effect border-primary/20">
              <div className="flex items-center justify-between">
                {/* Player 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{player1.name}</div>
                    <div className="text-xs text-muted-foreground">Score: {player1.score}</div>
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-3xl font-bold font-mono">{formatTime(timeLeft)}</span>
                  </div>
                  <Progress value={(timeLeft / 180) * 100} className="w-48 h-2" />
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-semibold text-right">{player2.name}</div>
                    <div className="text-xs text-muted-foreground text-right">Score: {player2.score}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-foreground" />
                  </div>
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
                <p className="text-lg text-balance leading-relaxed">{battleTopic}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Marketing
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Creative
                  </Badge>
                </div>
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
                                    
                                    <Button variant="outline" className="mt-2">Submit Final</Button>
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
                        className="dark:bg-zinc-900 w-full border border-zinc-300 dark:border-zinc-800 outline-none rounded shadow-xl"
                        value={prompt}
                        ref={inputRef}
                        placeholder="Say something..."
                        onChange={e => setPrompt(e.currentTarget.value)}
                      />
                      <Button type="submit" variant="ghost" className="px-5 py-6"><Send className="w-5 h-5" /></Button>
                    </form>
                  </div>
                </div>

              </Card>
            </div>
          </div>
        </div>

        {/* Test Prompt Modal */}
        {isTestingPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden glass-effect border-primary/20">
              <div className="p-6 border-b border-border/20 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Prompt Test Results</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTestingPrompt(false)}
                  className="hover:bg-destructive/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Your Prompt:</h4>
                  <div className="p-4 rounded-lg bg-secondary/30 text-sm font-mono">
                    {prompt}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">AI Output:</h4>
                  <div className="p-4 rounded-lg bg-secondary/30 min-h-[200px] text-foreground leading-relaxed">
                    {isGenerating && !testOutput && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Generating response...
                      </div>
                    )}
                    {testOutput || (isGenerating ? "" : "Output will appear here...")}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
