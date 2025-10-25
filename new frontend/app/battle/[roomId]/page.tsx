"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Clock, User, Send, Lightbulb, Trophy, Zap, Target, Brain } from "lucide-react"
import { use } from "react"
import { Navigation } from "@/components/navigation"

export default function BattleArena({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const [prompt, setPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [phase, setPhase] = useState<"waiting" | "prompting" | "testing" | "results">("prompting")
  const [showTips, setShowTips] = useState(false)

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

  const handleSubmit = () => {
    console.log("[v0] Submitting prompt:", prompt)
    setPhase("testing")
  }

  const handleTest = () => {
    console.log("[v0] Testing prompt")
    // Navigate to testing playground
  }

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
                    <Clock className="w-5 h-5 text-accent" />
                    <span className="text-3xl font-bold font-mono text-accent">{formatTime(timeLeft)}</span>
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

              {/* Tips card */}
              <Card className="p-6 glass-effect border-accent/20">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center gap-2 mb-4 w-full text-left hover:text-accent transition-colors"
                >
                  <Lightbulb className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Prompt Tips</h3>
                </button>
                {showTips && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>Be specific about the desired output format</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>Include context and constraints</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>Use examples to guide the AI</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>Specify tone and style preferences</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>Break complex tasks into steps</span>
                    </li>
                  </ul>
                )}
              </Card>

              {/* Scoring criteria */}
              <Card className="p-6 glass-effect border-success/20">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-success" />
                  <h3 className="font-semibold">Scoring</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clarity</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specificity</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Output Quality</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creativity</span>
                    <span className="font-semibold">20%</span>
                  </div>
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

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Write your prompt here... Be specific, clear, and creative!"
                  className="min-h-[400px] bg-secondary/30 border-border/50 focus:border-primary transition-colors resize-none font-mono text-base leading-relaxed"
                />

                <div className="mt-6 flex items-center gap-3">
                  <Button
                    onClick={handleTest}
                    variant="outline"
                    className="flex-1 h-12 border-accent/50 hover:bg-accent/10 hover:border-accent transition-colors bg-transparent"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Test Prompt
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!prompt.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Submit Final
                  </Button>
                </div>
              </Card>

              {/* Live feedback */}
              <Card className="p-6 glass-effect border-primary/20">
                <h3 className="font-semibold mb-4">Real-time Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Clarity Score</span>
                      <span className="font-semibold text-primary">{prompt.length > 50 ? "85%" : "—"}</span>
                    </div>
                    <Progress value={prompt.length > 50 ? 85 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Specificity</span>
                      <span className="font-semibold text-accent">{prompt.length > 100 ? "72%" : "—"}</span>
                    </div>
                    <Progress value={prompt.length > 100 ? 72 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Structure</span>
                      <span className="font-semibold text-success">{prompt.length > 150 ? "90%" : "—"}</span>
                    </div>
                    <Progress value={prompt.length > 150 ? 90 : 0} className="h-2" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
