"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Clock, User, Send, Lightbulb, Trophy, Zap, Target, Brain, X } from "lucide-react"
import { use } from "react"
import { Navigation } from "@/components/navigation"

export default function BattleArena({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const [prompt, setPrompt] = useState("")
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [phase, setPhase] = useState<"waiting" | "prompting" | "testing" | "results">("prompting")
  const [showTips, setShowTips] = useState(false)
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const [testOutput, setTestOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    try {
      const response = await fetch('/api/rooms/submit-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomId,
          prompt: prompt.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error submitting prompt:', data.error)
        alert(`Failed to submit: ${data.error}`)
        return
      }

      console.log('Prompt submitted successfully:', data.message)

      if (data.allSubmitted) {
        // Both players have submitted, ready for judging
        setPhase("results")
      } else {
        // Waiting for other player
        alert('Prompt submitted! Waiting for opponent...')
      }
    } catch (error) {
      console.error('Error submitting prompt:', error)
      alert('Failed to submit prompt. Please try again.')
    }
  }

  const handleTest = async () => {
    if (!prompt.trim()) return

    setIsTestingPrompt(true)
    setIsGenerating(true)
    setTestOutput("")

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.trim() || line === 'data: [DONE]') continue

            // Handle Server-Sent Events format: "data: {...}"
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6) // Remove "data: " prefix
              try {
                const parsed = JSON.parse(jsonStr)

                // Handle text-delta events which contain the actual content
                if (parsed.type === 'text-delta' && parsed.delta) {
                  fullText += parsed.delta
                  setTestOutput(fullText)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error testing prompt:', error)
      setTestOutput('Error: Failed to test prompt. Please try again.')
    } finally {
      setIsGenerating(false)
    }
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
