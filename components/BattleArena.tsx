'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameRoom, ParticipantWithProfile } from '@/lib/types/database.types'

interface BattleArenaProps {
  room: GameRoom
  participants: ParticipantWithProfile[]
  currentUserId: string
  onParticipantsUpdate: (participants: ParticipantWithProfile[]) => void
}

export default function BattleArena({
  room,
  participants,
  currentUserId,
  onParticipantsUpdate
}: BattleArenaProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds for the battle
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const supabase = createClient()

  const currentParticipant = participants.find(p => p.user_id === currentUserId)
  const allSubmitted = participants.every(p => p.prompt !== null)

  useEffect(() => {
    if (currentParticipant?.prompt) {
      setHasSubmitted(true)
      setPrompt(currentParticipant.prompt)
    }
  }, [currentParticipant])

  // Countdown logic (3-2-1)
  useEffect(() => {
    if (room.status === 'countdown') {
      setCountdown(room.countdown_duration)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            // Update room status to playing
            if (room.host_id === currentUserId) {
              supabase
                .from('game_rooms')
                .update({
                  status: 'playing',
                  started_at: new Date().toISOString()
                })
                .eq('id', room.id)
                .then(() => {
                  setCountdown(null)
                })
            }
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [room.status, room.countdown_duration, room.host_id, currentUserId, room.id, supabase])

  // Battle timer
  useEffect(() => {
    if (room.status === 'playing' && !hasSubmitted) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [room.status, hasSubmitted])

  // Check if all submitted
  useEffect(() => {
    if (allSubmitted && room.status === 'playing' && room.host_id === currentUserId) {
      // Host updates room to finished
      supabase
        .from('game_rooms')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', room.id)
    }
  }, [allSubmitted, room.status, room.host_id, currentUserId, room.id, supabase])

  // Subscribe to participant updates
  useEffect(() => {
    const channel = supabase
      .channel(`room-battle-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `room_id=eq.${room.id}`
        },
        async () => {
          const { data, error } = await supabase
            .from('game_participants')
            .select(`
              *,
              profile:profiles(*)
            `)
            .eq('room_id', room.id)

          if (!error && data) {
            onParticipantsUpdate(data as ParticipantWithProfile[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase, onParticipantsUpdate])

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentParticipant || !prompt.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('game_participants')
        .update({
          prompt: prompt.trim(),
          submitted_at: new Date().toISOString()
        })
        .eq('id', currentParticipant.id)

      if (error) throw error

      setHasSubmitted(true)
    } catch (err) {
      console.error('Error submitting prompt:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show countdown
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl font-bold text-white animate-pulse mb-4">
            {countdown}
          </div>
          <p className="text-2xl text-white font-semibold">Get Ready!</p>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft > 30) return 'text-green-600'
    if (timeLeft > 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-6">
        {/* Timer and Status */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-semibold text-gray-800">BATTLE IN PROGRESS</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className={`text-4xl font-bold font-mono ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* Players Status */}
        <div className="grid grid-cols-2 gap-4">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all ${
                participant.prompt ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {participant.profile?.username || 'Anonymous'}
                  {participant.user_id === currentUserId && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </h3>
                {participant.prompt ? (
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {participant.prompt ? 'Prompt submitted' : 'Writing prompt...'}
              </p>
            </div>
          ))}
        </div>

        {/* Prompt Submission Form */}
        {hasSubmitted ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Prompt Submitted!</h3>
            <p className="text-gray-600 mb-4">Waiting for other players to finish...</p>
            <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 italic">"{prompt}"</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Create Your Best Prompt</h3>
            <p className="text-gray-600 mb-6">
              Write a creative prompt that will impress the AI judge. Be imaginative, specific, and engaging!
            </p>
            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all"
                required
                disabled={isSubmitting || timeLeft === 0}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {prompt.length} characters
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || !prompt.trim() || timeLeft === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : timeLeft === 0 ? (
                    "Time's Up!"
                  ) : (
                    'Submit Prompt'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
