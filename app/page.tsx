"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Sparkles, Zap, Trophy, BookOpen, Users, Code2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<"host" | "join">("host")
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to create a room",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()

      // Sign in anonymously with player name as metadata
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            player_name: playerName,
          },
        },
      })

      if (authError) throw authError

      // Create room via API
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create room")
      }

      const data = await response.json()

      toast({
        title: "Room created!",
        description: `Room code: ${data.room.room_code}`,
      })

      // Navigate to waiting room
      router.push(`/waiting/${data.room.id}`)
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create room",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async () => {
    console.log("Join room clicked! playerName:", playerName, "roomCode:", roomCode)

    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join a room",
        variant: "destructive",
      })
      return
    }

    if (roomCode.length !== 6) {
      toast({
        title: "Invalid room code",
        description: "Room code must be 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      const supabase = createClient()

      // Sign in anonymously with player name as metadata
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            player_name: playerName,
          },
        },
      })

      if (authError) throw authError

      // Join room via API
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join room")
      }

      const data = await response.json()

      toast({
        title: "Joined room!",
        description: `Welcome to room ${roomCode}`,
      })

      // Navigate to waiting room
      router.push(`/waiting/${data.room.id}`)
    } catch (error) {
      console.error("Error joining room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join room",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <>
      <Navigation />

      <div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left side - Hero content */}
            <div className="space-y-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                  <Zap className="w-4 h-4" />
                  Master AI Prompt Engineering
                </div>
                <h2 className="text-5xl font-bold leading-tight text-balance">
                  Battle. Learn.{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                    Dominate.
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground text-pretty">
                  Challenge friends in real-time prompt engineering battles. Test your skills, learn from the best, and
                  become an AI prompt master.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Real-time Battles</h3>
                  <p className="text-sm text-muted-foreground">Compete head-to-head with other players</p>
                </Card>
                <Card className="p-4 glass-effect border-accent/20 hover:border-accent/40 transition-colors">
                  <Code2 className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Test Playground</h3>
                  <p className="text-sm text-muted-foreground">Practice before you submit</p>
                </Card>
                <Card className="p-4 glass-effect border-success/20 hover:border-success/40 transition-colors">
                  <BookOpen className="w-8 h-8 text-success mb-2" />
                  <h3 className="font-semibold mb-1">Learn & Grow</h3>
                  <p className="text-sm text-muted-foreground">Tutorials and tips for beginners</p>
                </Card>
                <Card className="p-4 glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                  <Trophy className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Rank Up</h3>
                  <p className="text-sm text-muted-foreground">Climb the leaderboard</p>
                </Card>
              </div>
            </div>

            {/* Right side - Lobby card */}
            <Card className="p-8 glass-effect border-primary/20 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Start Playing</h3>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-secondary/30 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("host")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "host"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Host
                  </button>
                  <button
                    onClick={() => setActiveTab("join")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "join"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Join
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "host" ? (
                  <div className="space-y-4">
                    {/* Player name input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Name</label>
                      <Input
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="bg-secondary/50 border-border/50 focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Create room button */}
                    <Button
                      onClick={handleCreateRoom}
                      disabled={!playerName || isCreating}
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg font-semibold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {isCreating ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Player name input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Name</label>
                      <Input
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="bg-secondary/50 border-border/50 focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Room code input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Room Code</label>
                      <Input
                        placeholder="Enter 6-character code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="bg-secondary/50 border-border/50 focus:border-accent transition-colors text-center text-lg tracking-widest font-mono"
                      />
                    </div>

                    {/* Join room button */}
                    <Button
                      onClick={handleJoinRoom}
                      disabled={!playerName || roomCode.length !== 6 || isJoining}
                      variant="outline"
                      className="w-full h-12 border-accent/50 hover:bg-accent/10 hover:border-accent transition-colors text-lg font-semibold bg-transparent"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      {isJoining ? "Joining..." : "Join Room"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
