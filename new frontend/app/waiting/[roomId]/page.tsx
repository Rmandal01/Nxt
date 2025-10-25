"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Copy, Check, Users, Sparkles, Clock } from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Player {
  id: string
  name: string
  isReady: boolean
  isYou: boolean
}

export default function WaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [copied, setCopied] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", isReady: false, isYou: true },
    { id: "2", name: "Waiting...", isReady: false, isYou: false },
  ])

  // Backend integration point - listen for player updates
  useEffect(() => {
    console.log("[v0] Waiting room mounted for room:", roomId)
    // TODO: Connect to backend WebSocket/real-time updates
  }, [roomId])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleReady = () => {
    setIsReady(!isReady)
    // Backend integration point
    console.log("[v0] Player ready status changed:", !isReady)
  }

  const allPlayersReady = players.every((p) => p.isReady) && players.length === 2

  useEffect(() => {
    if (allPlayersReady) {
      // Auto-start game when all players are ready
      setTimeout(() => {
        console.log("[v0] All players ready, starting game...")
        router.push(`/battle/${roomId}`)
      }, 2000)
    }
  }, [allPlayersReady, roomId, router])

  const getPlayerInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-gradient-to-br from-primary to-accent",
      "bg-gradient-to-br from-accent to-success",
      "bg-gradient-to-br from-success to-primary",
    ]
    return colors[index % colors.length]
  }

  return (
    <>
      <Navigation />

      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Clock className="w-4 h-4 text-primary animate-pulse-glow" />
                <span className="text-sm font-medium text-primary">Waiting for players...</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Waiting Room
              </h1>
              <p className="text-muted-foreground">Get ready for an epic prompt battle!</p>
            </div>

            {/* Room Code Card */}
            <Card className="p-8 glass-effect border-primary/20 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Room Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-5xl font-bold tracking-wider font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {roomId}
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Share this code with your opponent to join</p>
              </div>
            </Card>

            {/* Players List */}
            <Card className="p-6 glass-effect border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Players ({players.filter((p) => p.name !== "Waiting...").length}/2)
                  </h2>
                </div>

                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-12 h-12 ${getAvatarColor(index)}`}>
                          <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                            {getPlayerInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{player.name}</p>
                            {player.isYou && (
                              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                You
                              </Badge>
                            )}
                          </div>
                          {player.name === "Waiting..." && (
                            <p className="text-xs text-muted-foreground">Waiting for player to join...</p>
                          )}
                        </div>
                      </div>

                      {player.name !== "Waiting..." && (
                        <Badge
                          variant={player.isReady ? "default" : "secondary"}
                          className={
                            player.isReady
                              ? "bg-success text-success-foreground"
                              : "bg-secondary/50 text-muted-foreground"
                          }
                        >
                          {player.isReady ? "Ready" : "Not Ready"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Ready Button */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button
                onClick={handleToggleReady}
                disabled={players.some((p) => p.name === "Waiting...")}
                className={`w-full h-14 text-lg font-semibold transition-all ${
                  isReady
                    ? "bg-success hover:bg-success/90 text-success-foreground"
                    : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                }`}
              >
                {isReady ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Ready!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Mark as Ready
                  </>
                )}
              </Button>

              {allPlayersReady && (
                <Card className="p-4 bg-gradient-to-r from-success/20 to-primary/20 border-success/30 animate-pulse-glow">
                  <p className="text-center font-medium text-success">
                    All players ready! Starting battle in a moment...
                  </p>
                </Card>
              )}

              {!allPlayersReady && players.every((p) => p.name !== "Waiting...") && (
                <Card className="p-4 bg-secondary/30 border-border/50">
                  <p className="text-center text-sm text-muted-foreground">Waiting for all players to be ready...</p>
                </Card>
              )}
            </div>

            {/* Tips Card */}
            <Card className="p-6 glass-effect border-accent/20 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-accent">
                  <Sparkles className="w-4 h-4" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Be specific and clear in your prompts for better AI responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Use the testing area to refine your prompt before submitting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Consider context, tone, and desired output format in your prompts</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
