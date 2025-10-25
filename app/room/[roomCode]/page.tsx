'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { GameRoom } from '@/lib/types/database.types'
import {
  backgroundGradient,
  containerStylesSmall,
  titleStyles,
  subtitleStyles,
  smallTextStyles,
  primaryButtonStyles,
  grayButtonStyles,
  smallButtonStyles,
  roomCodeContainerStyles,
  roomCodeTextStyles,
  textareaStyles,
  labelStyles,
  successStyles,
  formFieldStyles
} from '@/lib/styles'

interface Participant {
  id: string
  user_id: string
  is_ready: boolean
  profiles?: {
    username: string
  }
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params?.roomCode as string
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
      return
    }
    setCurrentUserId(userId)
    initializeRoom(userId)
  }, [router, roomCode])

  useEffect(() => {
    if (!room) return

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${room.id}`
        },
        (payload) => {
          const updatedRoom = payload.new as GameRoom
          setRoom(updatedRoom)
          if (updatedRoom.status === 'countdown' || updatedRoom.status === 'playing') {
            setGameStarted(true)
          }
        }
      )
      .subscribe()

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`participants-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `room_id=eq.${room.id}`
        },
        async () => {
          await fetchParticipants(room.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(participantsChannel)
    }
  }, [room?.id, supabase])

  const initializeRoom = async (userId: string) => {
    setLoading(true)
    setError('')

    try {
      // Fetch room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError || !roomData) {
        setError('Room not found')
        setTimeout(() => router.push('/'), 2000)
        return
      }

      setRoom(roomData)

      // Fetch participants
      await fetchParticipants(roomData.id)

      // Check game status
      if (roomData.status === 'countdown' || roomData.status === 'playing') {
        setGameStarted(true)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error initializing room:', err)
      setError('Failed to load room')
      setLoading(false)
    }
  }

  const fetchParticipants = async (roomId: string) => {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        id,
        user_id,
        is_ready,
        profiles (username)
      `)
      .eq('room_id', roomId)

    if (!error && data) {
      setParticipants(data as any)
    }
  }

  const handleReady = async () => {
    if (!room || !currentUserId) return

    const newReadyStatus = !isReady

    try {
      const { error } = await supabase
        .from('game_participants')
        .update({ is_ready: newReadyStatus })
        .eq('room_id', room.id)
        .eq('user_id', currentUserId)

      if (!error) {
        setIsReady(newReadyStatus)
      }
    } catch (err) {
      console.error('Error updating ready status:', err)
    }
  }

  const handleStartGame = async () => {
    if (!room || !currentUserId) return

    // Check if all players are ready
    const allReady = participants.every(p => p.is_ready)
    const roomFull = participants.length >= room.max_players

    if (!allReady || !roomFull) return

    try {
      await supabase
        .from('game_rooms')
        .update({
          status: 'playing',
          started_at: new Date().toISOString()
        })
        .eq('id', room.id)
    } catch (err) {
      console.error('Error starting game:', err)
    }
  }

  const handleSubmitPrompt = async () => {
    if (!prompt.trim() || !room || !currentUserId) return

    try {
      const { error } = await supabase
        .from('game_participants')
        .update({
          prompt: prompt.trim(),
          submitted_at: new Date().toISOString()
        })
        .eq('room_id', room.id)
        .eq('user_id', currentUserId)

      if (!error) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error submitting prompt:', err)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Room code copied!')
  }

  if (loading) {
    return (
      <div className={backgroundGradient}>
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <p className="text-gray-600 text-sm">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  if (!gameStarted) {
    // Waiting Room
    const allReady = participants.every(p => p.is_ready)
    const roomFull = participants.length >= (room?.max_players || 2)

    return (
      <div className={backgroundGradient}>
        <div className="w-full max-w-2xl">
          <div className={containerStylesSmall}>
            <div className="text-center space-y-4">
              <h1 className={titleStyles}>
                Waiting Room
              </h1>
              <div className={roomCodeContainerStyles}>
                <p className="text-sm text-gray-600 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-3">
                  <p className={roomCodeTextStyles}>{roomCode}</p>
                  <button
                    onClick={handleCopyCode}
                    className={smallButtonStyles}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">Players ({participants.length}/{room?.max_players || 2})</h2>
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {participant.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{participant.profiles?.username || 'Unknown'}</p>
                      {participant.user_id === currentUserId && (
                        <p className="text-xs text-purple-600">You</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    participant.is_ready
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {participant.is_ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}

              {participants.length < (room?.max_players || 2) && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300" />
                    <p className="text-gray-400">Waiting for opponent...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={handleReady}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  isReady
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isReady ? 'Not Ready' : 'Ready'}
              </button>

              {room?.host_id === currentUserId && (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady || !roomFull}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {allReady && roomFull ? 'Start Game' : 'Waiting for all players to be ready...'}
                </button>
              )}

              {allReady && roomFull && room?.host_id !== currentUserId && (
                <div className="text-center text-green-600 font-semibold animate-pulse">
                  Waiting for host to start the game...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Battle Arena
  return (
    <div className={backgroundGradient}>
      <div className="w-full max-w-3xl">
        <div className={containerStylesSmall}>
          <div className="text-center space-y-2">
            <h1 className={titleStyles}>
              Battle Arena
            </h1>
            <p className={subtitleStyles}>Submit your best prompt!</p>
          </div>

          {!submitted ? (
            <div className={formFieldStyles}>
              <div>
                <label className={labelStyles}>
                  Your Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Write a creative prompt that will impress the AI judge..."
                  rows={6}
                  className={textareaStyles}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {prompt.length}/500
                </div>
              </div>

              <button
                onClick={handleSubmitPrompt}
                disabled={!prompt.trim()}
                className={primaryButtonStyles}
              >
                Submit Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={successStyles}>
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <h3 className="text-lg font-semibold text-green-700">Prompt Submitted!</h3>
                </div>
                <p className="text-sm text-green-600 mb-3">Your prompt:</p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-900 italic">"{prompt}"</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700 font-semibold mb-2">Waiting for Opponent</p>
                <p className="text-sm text-blue-600">
                  Once both players submit, the AI will judge the prompts!
                </p>
              </div>

              <button
                onClick={() => router.push('/')}
                className={grayButtonStyles}
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
