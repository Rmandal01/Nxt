"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Brain, Star, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface GameResult {
  id: string
  room_id: string
  winner_id: string | null
  player1_id: string | null
  player2_id: string | null
  player1_score: number
  player2_score: number
  judge_reasoning: string
  created_at: string
}

interface Participant {
  id: string
  user_id: string
  prompt: string | null
  profile?: {
    username: string
  }
}

export default function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const [result, setResult] = useState<GameResult | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const supabase = createClient()
        
        // Get game result
        const { data: gameResult, error: resultError } = await supabase
          .from('game_results')
          .select('*')
          .eq('room_id', roomId)
          .single()

        if (resultError || !gameResult) {
          setError('Results not found. The game may still be in progress.')
          setLoading(false)
          return
        }

        setResult(gameResult)

        // Get participants with their profiles
        const { data: participantsData, error: participantsError } = await supabase
          .from('game_participants')
          .select(`
            id,
            user_id,
            prompt,
            profiles!inner(username)
          `)
          .eq('room_id', roomId)
          .order('joined_at', { ascending: true })

        if (participantsError) {
          console.error('Error fetching participants:', participantsError)
          setError('Failed to load participant data')
        } else {
          setParticipants(participantsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Failed to load results')
        setLoading(false)
      }
    }

    fetchResults()
  }, [roomId])

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading results...</p>
        </div>
      </>
    )
  }

  if (error || !result) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-lg mb-4">{error || 'Results not found'}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </>
    )
  }

  const player1 = participants[0]
  const player2 = participants[1]
  const isPlayer1Winner = result.winner_id === result.player1_id

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Battle Results</h1>
            <p className="text-lg text-gray-600">AI has made its judgment!</p>
          </div>

          {/* Winner Announcement */}
          <Card className="p-8 glass-effect border-primary/20 text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-500 mr-4" />
              <h2 className="text-3xl font-bold">
                {isPlayer1Winner ? player1?.profile?.username : player2?.profile?.username} Wins!
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              {isPlayer1Winner ? player1?.profile?.username : player2?.profile?.username} scored{' '}
              {isPlayer1Winner ? result.player1_score : result.player2_score} points
            </p>
          </Card>

          {/* Scores */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Player 1 */}
            <Card className="p-6 glass-effect border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{player1?.profile?.username || 'Player 1'}</h3>
                <Badge variant={isPlayer1Winner ? "default" : "secondary"} className="text-lg px-3 py-1">
                  {result.player1_score}/100
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Prompt:</h4>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    {player1?.prompt || 'No prompt submitted'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Player 2 */}
            <Card className="p-6 glass-effect border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{player2?.profile?.username || 'Player 2'}</h3>
                <Badge variant={!isPlayer1Winner ? "default" : "secondary"} className="text-lg px-3 py-1">
                  {result.player2_score}/100
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Prompt:</h4>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    {player2?.prompt || 'No prompt submitted'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Reasoning */}
          <Card className="p-6 glass-effect border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">AI Judge Reasoning</h3>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.judge_reasoning}
              </p>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={() => router.push('/leaderboard')} variant="default">
              <Trophy className="w-4 h-4 mr-2" />
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
