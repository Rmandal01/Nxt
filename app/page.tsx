'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  backgroundGradient,
  containerStyles,
  inputStyles,
  labelStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  errorStyles,
  titleStylesLarge,
  subtitleStyles,
  smallTextStyles
} from '@/lib/styles'

export default function Home() {
  const [roomCode, setRoomCode] = useState('')
  const [username, setUsername] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError('Please enter your name first')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Generate unique room code
      let code = generateRoomCode()
      let isUnique = false

      while (!isUnique) {
        const { data: existing } = await supabase
          .from('game_rooms')
          .select('id')
          .eq('room_code', code)
          .single()

        if (!existing) {
          isUnique = true
        } else {
          code = generateRoomCode()
        }
      }

      // Create a temporary user ID (since we don't have auth)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username.trim()
        })

      if (profileError) throw profileError

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: code,
          host_id: userId,
          status: 'waiting'
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add host as participant
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          room_id: room.id,
          user_id: userId,
          is_ready: false
        })

      if (participantError) throw participantError

      // Store user info in localStorage
      localStorage.setItem('userId', userId)
      localStorage.setItem('username', username.trim())

      router.push(`/room/${code}`)
    } catch (err: any) {
      console.error('Error creating room:', err)
      setError(err.message || 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Please enter your name first')
      return
    }

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      // Find room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single()

      if (roomError || !room) {
        setError('Room not found or already started')
        setIsJoining(false)
        return
      }

      // Check if room is full
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('*')
        .eq('room_id', room.id)

      if (participantsError) throw participantsError

      if (participants && participants.length >= room.max_players) {
        setError('Room is full')
        setIsJoining(false)
        return
      }

      // Create a temporary user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username.trim()
        })

      if (profileError) throw profileError

      // Add user as participant
      const { error: joinError } = await supabase
        .from('game_participants')
        .insert({
          room_id: room.id,
          user_id: userId,
          is_ready: false
        })

      if (joinError) throw joinError

      // Store user info in localStorage
      localStorage.setItem('userId', userId)
      localStorage.setItem('username', username.trim())

      router.push(`/room/${roomCode.toUpperCase()}`)
    } catch (err: any) {
      console.error('Error joining room:', err)
      setError(err.message || 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className={backgroundGradient}>
      <div className="w-full max-w-md">
        <div className={containerStyles}>
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className={titleStylesLarge}>
              Prompt Battle
            </h1>
            <p className={subtitleStyles}>
              Challenge your creativity in real-time
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={errorStyles}>
              {error}
            </div>
          )}

          {/* Username Input */}
          <div>
            <label htmlFor="username" className={labelStyles}>
              Your Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="Enter your name"
              className={inputStyles}
              required
            />
          </div>

          {/* Create Room */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className={primaryButtonStyles}
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </button>
            <p className={smallTextStyles}>
              Start a new game and invite a friend
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <div>
              <label htmlFor="roomCode" className={labelStyles}>
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Enter 6-character code"
                maxLength={6}
                className={`${inputStyles} text-center text-lg font-mono uppercase`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || roomCode.length !== 6}
              className={secondaryButtonStyles}
            >
              {isJoining ? 'Joining Room...' : 'Join Room'}
            </button>
            <p className={smallTextStyles}>
              Join an existing game with a code
            </p>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200">
<<<<<<< HEAD
            <p className={smallTextStyles}>
              Compete against your friends to create the best AI prompts
=======
            <p className="text-xs text-gray-500 text-center">
              Real-time multiplayer powered by Supabase
>>>>>>> 39b1097 (Implement Supabase database integration for real-time multiplayer)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
