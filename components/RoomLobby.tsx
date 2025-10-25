'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameRoom, ParticipantWithProfile } from '@/lib/types/database.types'

interface RoomLobbyProps {
  room: GameRoom
  participants: ParticipantWithProfile[]
  currentUserId: string
  onParticipantsUpdate: (participants: ParticipantWithProfile[]) => void
}

export default function RoomLobby({
  room,
  participants,
  currentUserId,
  onParticipantsUpdate
}: RoomLobbyProps) {
  const [isReady, setIsReady] = useState(false)
  const [isTogglingReady, setIsTogglingReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const isHost = room.host_id === currentUserId
  const currentParticipant = participants.find(p => p.user_id === currentUserId)
  const allReady = participants.length >= 2 && participants.every(p => p.is_ready)

  useEffect(() => {
    if (currentParticipant) {
      setIsReady(currentParticipant.is_ready)
    }
  }, [currentParticipant])

  useEffect(() => {
    // Subscribe to participant changes
    const channel = supabase
      .channel(`room-lobby-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `room_id=eq.${room.id}`
        },
        async () => {
          // Fetch updated participants
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

  const handleToggleReady = async () => {
    if (!currentParticipant) return

    setIsTogglingReady(true)
    try {
      const newReadyState = !isReady

      const { error } = await supabase
        .from('game_participants')
        .update({ is_ready: newReadyState })
        .eq('id', currentParticipant.id)

      if (error) throw error

      setIsReady(newReadyState)
    } catch (err) {
      console.error('Error toggling ready state:', err)
    } finally {
      setIsTogglingReady(false)
    }
  }

  const handleStartGame = async () => {
    if (!isHost || !allReady) return

    try {
      // Update room status to countdown
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'countdown' })
        .eq('id', room.id)

      if (error) throw error
    } catch (err) {
      console.error('Error starting game:', err)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Room Code Display */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Room Code</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-mono text-3xl font-bold tracking-wider">
                {room.room_code}
              </div>
              <button
                onClick={copyRoomCode}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title="Copy room code"
              >
                {copied ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Share this code with your opponent
            </p>
          </div>

          {/* Players List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Players ({participants.length}/{room.max_players})
            </h3>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    participant.is_ready
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      participant.is_ready ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">
                        {participant.profile?.username || 'Anonymous'}
                        {participant.user_id === room.host_id && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                        {participant.user_id === currentUserId && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participant.profile ? (
                          `${participant.profile.wins}W - ${participant.profile.losses}L`
                        ) : (
                          'No stats yet'
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    {participant.is_ready ? (
                      <span className="text-green-600 font-semibold">Ready</span>
                    ) : (
                      <span className="text-gray-400">Waiting...</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: room.max_players - participants.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <p className="text-gray-400 italic">Waiting for player...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ready Button */}
          <div className="space-y-3">
            <button
              onClick={handleToggleReady}
              disabled={isTogglingReady}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isReady
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
              }`}
            >
              {isTogglingReady ? 'Updating...' : isReady ? 'Not Ready' : 'Ready'}
            </button>

            {/* Start Game Button (Host Only) */}
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {allReady ? 'Start Game' : 'Waiting for all players to be ready...'}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {isHost
                ? 'You are the host. Click "Start Game" when everyone is ready.'
                : 'Waiting for the host to start the game...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
