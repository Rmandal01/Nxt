'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [showUsername, setShowUsername] = useState(false)
  const router = useRouter()

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setShowUsername(true)
      setError('Please enter your name first')
      return
    }

    const code = generateRoomCode()
    localStorage.setItem('username', username)
    router.push(`/room/${code}`)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setShowUsername(true)
      setError('Please enter your name first')
      return
    }

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }

    localStorage.setItem('username', username)
    router.push(`/room/${roomCode.toUpperCase()}`)
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
            <p className={smallTextStyles}>
              Compete against your friends to create the best AI prompts
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
