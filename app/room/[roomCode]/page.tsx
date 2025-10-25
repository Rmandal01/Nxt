'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { GameRoom } from '@/lib/types/database.types'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
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

function MarkdownComponent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkBreaks]}
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {children}
          </a>
        ),
      }}
    >{content}</Markdown>
  )
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
  const [finalPrompt, setFinalPrompt] = useState('')

  const messagesRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Chat integration for prompt improvement
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai',
    }),
  })

  const [chatInput, setChatInput] = useState('')

  // Auto scroll to bottom when new messages come up
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight)
    }
  }, [messages])

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

    console.log('Setting up real-time subscriptions for room:', room.id)

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
          console.log('Room update received:', payload)
          const updatedRoom = payload.new as GameRoom
          setRoom(updatedRoom)
          if (updatedRoom.status === 'countdown' || updatedRoom.status === 'playing') {
            setGameStarted(true)
          }
        }
      )
      .subscribe((status) => {
        console.log('Room channel status:', status)
      })

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
        async (payload) => {
          console.log('Participant change received:', payload)
          await fetchParticipants(room.id)
        }
      )
      .subscribe((status) => {
        console.log('Participants channel status:', status)
      })

    // Initial fetch
    fetchParticipants(room.id)

    return () => {
      console.log('Cleaning up subscriptions')
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(participantsChannel)
    }
  }, [room?.id])

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
    console.log('Fetching participants for room:', roomId)
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        id,
        user_id,
        is_ready,
        profiles (username)
      `)
      .eq('room_id', roomId)

    if (error) {
      console.error('Error fetching participants:', error)
      return
    }

    if (data) {
      console.log('Participants fetched:', data)
      setParticipants(data as any)

      // Update local ready state based on current user
      const currentParticipant = data.find(p => p.user_id === currentUserId)
      if (currentParticipant) {
        setIsReady(currentParticipant.is_ready)
      }
    }
  }

  const handleReady = async () => {
    if (!room || !currentUserId) return

    const newReadyStatus = !isReady
    console.log('Updating ready status to:', newReadyStatus, 'for user:', currentUserId)

    try {
      const { data, error } = await supabase
        .from('game_participants')
        .update({ is_ready: newReadyStatus })
        .eq('room_id', room.id)
        .eq('user_id', currentUserId)
        .select()

      if (error) {
        console.error('Error updating ready status:', error)
        return
      }

      console.log('Ready status updated successfully:', data)
      setIsReady(newReadyStatus)

      // Manually refetch to ensure UI is in sync
      await fetchParticipants(room.id)
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    sendMessage({ text: chatInput })
    setChatInput('')
  }

  const handleSubmitFinalPrompt = async () => {
    if (!finalPrompt.trim()) {
      alert('Please set a final prompt first by clicking "Use This Prompt"')
      return
    }

    setPrompt(finalPrompt)
    await handleSubmitPrompt()
  }

  // Battle Arena with AI Chat
  return (
    <div className={backgroundGradient}>
      <div className="w-full max-w-5xl">
        <div className={containerStylesSmall}>
          <div className="text-center space-y-2 mb-4">
            <h1 className={titleStyles}>
              Battle Arena
            </h1>
            <p className={subtitleStyles}>Chat with AI to craft the perfect prompt!</p>
          </div>

          {!submitted ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chat Interface */}
              <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                  <h2 className="font-semibold">AI Prompt Coach</h2>
                  <p className="text-xs text-purple-100">Get real-time feedback to improve your prompt</p>
                </div>

                {/* Messages */}
                <div
                  ref={messagesRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <p className="text-sm">Start by sending your prompt idea!</p>
                      <p className="text-xs mt-2">The AI will help you improve it.</p>
                    </div>
                  )}

                  {messages.map(message => (
                    <div key={message.id}>
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          if (message.role === 'user') {
                            return (
                              <div
                                key={i}
                                className="flex justify-end"
                              >
                                <div className="rounded-lg bg-blue-600 text-white p-3 max-w-[80%]">
                                  <MarkdownComponent content={part.text} />
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div key={i} className="flex justify-start">
                                <div className="rounded-lg bg-gray-100 p-3 max-w-[80%]">
                                  <MarkdownComponent content={part.text} />
                                </div>
                              </div>
                            )
                          }
                        }
                        return null
                      })}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask AI to improve your prompt..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>

              {/* Final Prompt Panel */}
              <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4">
                  <h2 className="font-semibold">Your Final Prompt</h2>
                  <p className="text-xs text-green-100">Refine and submit when ready</p>
                </div>

                <div className="flex-1 p-4 flex flex-col gap-4">
                  <div className="flex-1">
                    <label className={labelStyles}>
                      Final Prompt to Submit
                    </label>
                    <textarea
                      value={finalPrompt}
                      onChange={(e) => setFinalPrompt(e.target.value)}
                      placeholder="Copy the AI's improved version here, or write your own..."
                      className="w-full h-[calc(100%-2rem)] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-right text-sm text-gray-500">
                      {finalPrompt.length} characters
                    </div>

                    <button
                      onClick={handleSubmitFinalPrompt}
                      disabled={!finalPrompt.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Submit Final Prompt
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Once you submit, you cannot change it!
                    </p>
                  </div>
                </div>
              </div>
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
