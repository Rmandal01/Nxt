'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { GameRoom, ParticipantWithProfile, GameResultWithProfiles } from '@/lib/types/database.types'

interface ResultsProps {
  room: GameRoom
  participants: ParticipantWithProfile[]
  currentUserId: string
}

export default function Results({ room, participants, currentUserId }: ResultsProps) {
  const [result, setResult] = useState<GameResultWithProfiles | null>(null)
  const [isJudging, setIsJudging] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const isHost = room.host_id === currentUserId

  useEffect(() => {
    // Subscribe to game results
    const channel = supabase
      .channel(`room-results-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_results',
          filter: `room_id=eq.${room.id}`
        },
        async () => {
          fetchResults()
        }
      )
      .subscribe()

    // Initial fetch
    fetchResults()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase])

  useEffect(() => {
    // Auto-trigger judging if host and no results yet
    if (isHost && !result && !isJudging && participants.every(p => p.prompt)) {
      triggerJudging()
    }
  }, [isHost, result, isJudging, participants])

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('game_results')
        .select(`
          *,
          player1:profiles!game_results_player1_id_fkey(*),
          player2:profiles!game_results_player2_id_fkey(*),
          winner:profiles!game_results_winner_id_fkey(*)
        `)
        .eq('room_id', room.id)
        .single()

      if (!error && data) {
        setResult(data as GameResultWithProfiles)
      }
    } catch (err) {
      // Results might not exist yet
      console.log('No results yet')
    }
  }

  const triggerJudging = async () => {
    if (participants.length < 2) return

    setIsJudging(true)
    setError('')

    try {
      const player1 = participants[0]
      const player2 = participants[1]

      if (!player1.prompt || !player2.prompt) {
        throw new Error('Missing prompts')
      }

      // Call the judging API
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: room.id,
          player1Id: player1.user_id,
          player2Id: player2.user_id,
          prompt1: player1.prompt,
          prompt2: player2.prompt
        })
      })

      if (!response.ok) {
        throw new Error('Judging failed')
      }

      const data = await response.json()

      // Create game result
      const { error: resultError } = await supabase
        .from('game_results')
        .insert({
          room_id: room.id,
          player1_id: player1.user_id,
          player2_id: player2.user_id,
          player1_score: data.scores.player1,
          player2_score: data.scores.player2,
          winner_id: data.winnerId,
          judge_reasoning: data.reasoning
        })

      if (resultError) throw resultError

      // Update player stats
      await updatePlayerStats(data.winnerId, player1.user_id, player2.user_id)
    } catch (err) {
      console.error('Error during judging:', err)
      setError('Failed to judge the battle. Please try again.')
    } finally {
      setIsJudging(false)
    }
  }

  const updatePlayerStats = async (winnerId: string, player1Id: string, player2Id: string) => {
    try {
      // Update winner stats
      const { data: winner } = await supabase
        .from('profiles')
        .select('wins')
        .eq('id', winnerId)
        .single()

      if (winner) {
        await supabase
          .from('profiles')
          .update({ wins: winner.wins + 1 })
          .eq('id', winnerId)
      }

      // Update loser stats
      const loserId = winnerId === player1Id ? player2Id : player1Id
      const { data: loser } = await supabase
        .from('profiles')
        .select('losses')
        .eq('id', loserId)
        .single()

      if (loser) {
        await supabase
          .from('profiles')
          .update({ losses: loser.losses + 1 })
          .eq('id', loserId)
      }
    } catch (err) {
      console.error('Error updating player stats:', err)
    }
  }

  const handlePlayAgain = () => {
    router.push('/')
  }

  if (isJudging) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 text-purple-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Judging in Progress...</h2>
          <p className="text-gray-600">
            Our AI judge is analyzing the prompts and determining the winner
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 text-purple-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Loading Results...</h2>
          <p className="text-gray-600">Please wait while we fetch the battle results</p>
        </div>
      </div>
    )
  }

  const player1 = participants.find(p => p.user_id === result.player1_id)
  const player2 = participants.find(p => p.user_id === result.player2_id)
  const isWinner = result.winner_id === currentUserId

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Winner Announcement */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            {isWinner ? (
              <div>
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
                  VICTORY!
                </h1>
                <p className="text-2xl text-gray-700 font-semibold">You won the battle!</p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">😔</div>
                <h1 className="text-5xl font-bold text-gray-700 mb-2">
                  Good Try!
                </h1>
                <p className="text-2xl text-gray-600 font-semibold">Better luck next time!</p>
              </div>
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player 1 */}
          <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 ${
            result.winner_id === player1?.user_id ? 'ring-4 ring-yellow-400' : ''
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {player1?.profile?.username || 'Player 1'}
                {result.winner_id === player1?.user_id && (
                  <span className="ml-2 text-2xl">👑</span>
                )}
              </h3>
              <div className="text-3xl font-bold text-purple-600">
                {result.player1_score}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 min-h-32">
              <p className="text-sm text-gray-700 italic">
                "{player1?.prompt}"
              </p>
            </div>
          </div>

          {/* Player 2 */}
          <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 ${
            result.winner_id === player2?.user_id ? 'ring-4 ring-yellow-400' : ''
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {player2?.profile?.username || 'Player 2'}
                {result.winner_id === player2?.user_id && (
                  <span className="ml-2 text-2xl">👑</span>
                )}
              </h3>
              <div className="text-3xl font-bold text-purple-600">
                {result.player2_score}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 min-h-32">
              <p className="text-sm text-gray-700 italic">
                "{player2?.prompt}"
              </p>
            </div>
          </div>
        </div>

        {/* Judge's Reasoning */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🤖</span>
            Judge's Reasoning
          </h3>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.judge_reasoning}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
