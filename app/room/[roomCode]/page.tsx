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
  smallButtonStyles,
  roomCodeContainerStyles,
  roomCodeTextStyles
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
    initializeRoom()
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

  const initializeRoom = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Auto-focus on typing
    if (e.key.length === 1 && document.activeElement?.tagName !== 'INPUT') {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      if (input) input.focus()
    }
  }

  // Battle Arena - ChatGPT-style full screen
  return (
    <div className="flex flex-col h-screen bg-[#343541]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202123] border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-lg">Prompt Battle</h1>
          <div className="px-3 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
            Room: {roomCode}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {participants.length} / {room?.max_players || 2} players
          </div>
          {!submitted && (
            <button
              onClick={async () => {
                if (messages.length === 0) {
                  alert('Please test your prompt first!')
                  return
                }
                const lastUserMessage = messages.filter(m => m.role === 'user').pop()
                if (lastUserMessage && lastUserMessage.parts[0]?.type === 'text') {
                  setPrompt(lastUserMessage.parts[0].text)
                  await handleSubmitPrompt()
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Submit Final Prompt
            </button>
          )}
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Chat Messages - Full Screen */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-24">
                  <div className="mb-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-2xl font-semibold mb-2 text-gray-300">Test Your Prompt</p>
                    <p className="text-base text-gray-500">Type your prompt below to see how AI responds</p>
                  </div>
                </div>
              )}

              {messages.map(message => (
                <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'bg-transparent' : 'bg-[#444654]'} py-6 ${message.role === 'assistant' ? '-mx-4 px-4' : ''}`}>
                  <div className="max-w-3xl mx-auto">
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        if (message.role === 'user') {
                          return (
                            <div key={i} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center text-white font-semibold">
                                U
                              </div>
                              <div className="flex-1 text-white leading-7">
                                <MarkdownComponent content={part.text} />
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div key={i} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center text-white font-semibold">
                                AI
                              </div>
                              <div className="flex-1 text-gray-100 leading-7">
                                <MarkdownComponent content={part.text} />
                              </div>
                            </div>
                          )
                        }
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-white/10 bg-[#343541]">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <form onSubmit={handleSendMessage} className="relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  placeholder="Send a message..."
                  rows={1}
                  className="w-full bg-[#40414f] text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-2">
                Press Enter to send • Shift+Enter for new line • Submit when ready
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-[#444654] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Prompt Submitted!</h3>
              <div className="bg-[#343541] rounded-lg p-4 my-4">
                <p className="text-sm text-gray-400 mb-2">Your prompt:</p>
                <p className="text-white italic">"{prompt}"</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-4">
                <p className="text-blue-300 font-medium mb-1">Waiting for Opponent</p>
                <p className="text-sm text-blue-400">
                  Once both players submit, the AI will judge the prompts!
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
