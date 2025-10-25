"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Copy, Check, Users, Sparkles, Clock } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/client"

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
  const [roomCode, setRoomCode] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [players, setPlayers] = useState<Player[]>([])

  // Fetch room data and listen for player updates
  useEffect(() => {
    const supabase = createClient()
    let channel: any

    // Fetch current user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      } else {
        router.push('/') // bruh why are you even here
      }
    }

    // Fetch room data and participants
    const fetchRoomData = async () => {
      // Fetch room code
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('room_code')
        .eq('id', roomId)
        .single()

      if (roomError) {
        console.error('Error fetching room:', roomError)
      } else if (room) {
        setRoomCode(room.room_code)
      }

      // Fetch participants with profile data
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select(`
          id,
          user_id,
          is_ready,
          profiles:user_id (username)
        `)
        .eq('room_id', roomId)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
      } else if (participants) {
        const { data: { user } } = await supabase.auth.getUser()
        const playersList: Player[] = participants.map((p: any) => ({
          id: p.user_id,
          name: p.profiles?.username || 'Anonymous',
          isReady: p.is_ready,
          isYou: user?.id === p.user_id,
        }))
        setPlayers(playersList)
      }

      setLoading(false)
    }

    fetchUser()
    fetchRoomData()

    // Set up real-time subscription for participant changes
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
          fetchRoomData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleReady = async () => {
    // Optimistically update the UI and capture the new state.
    // This runs synchronously and guarantees we have the *actual* new state.
    let intendedNewState;
    setIsReady((currentState) => {
      intendedNewState = !currentState;
      return intendedNewState;
    });

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // If we can't get a user, we must roll back the UI change.
        throw new Error('User not found, rolling back UI state.');
      }

      // Send the *actual* new state (captured above) to the database.
      const { error } = await supabase
        .from('game_participants')
        .update({ is_ready: intendedNewState }) 
        .eq('room_id', roomId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating ready status:', error)
        // Roll back the UI.
        setIsReady((currentState) => !currentState);
      }
    } catch (error) {
      console.error('Failed to update ready status:', error)
      setIsReady((currentState) => !currentState);
    }
  }

  const allPlayersReady = players.every((p) => p.isReady) && players.length === 2; // need to be more than 1 player

  useEffect(() => {
    if (allPlayersReady) {
      // Auto-start game when all players are ready
      setTimeout(async () => {
        // update status in db to playing
        const supabase = createClient();
        const { error } = await supabase.from('game_rooms').update({ status: 'playing' }).eq('id', roomId);
        
        if (error) {
          console.error('Error updating room status:', error);
          return;
        }
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

      <div>
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
            </div>

            {/* Room Code Card */}
            <Card className="p-8 glass-effect border-primary/20 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Room Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-5xl font-bold tracking-wider font-mono text-gray-300">
                      {loading ? "Loading..." : roomCode}
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      size="sm"
                      disabled={!roomCode}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Share this code with your opponents to join</p>
              </div>
            </Card>

            {/* Players List */}
            <Card className="p-6 glass-effect border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Players ({players.filter((p) => p.name !== "Waiting...").length})
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
                    All players ready, starting!
                  </p>
                </Card>
              )}

              {!allPlayersReady && players.every((p) => p.name !== "Waiting...") && (
                <Card className="p-4 bg-secondary/30 border-border/50">
                  <p className="text-center text-sm text-muted-foreground">Waiting for all players to be ready...</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
