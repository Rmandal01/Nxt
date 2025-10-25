'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Prompt Battle
            </h1>
            <p className="text-gray-600 text-sm">
              Challenge your creativity in real-time
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Create Room */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </button>
            <p className="text-xs text-gray-500 text-center">
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
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || roomCode.length !== 6}
              className="w-full bg-white border-2 border-purple-600 text-purple-600 font-semibold py-4 px-6 rounded-xl hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isJoining ? 'Joining Room...' : 'Join Room'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Join an existing game with a code
            </p>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Compete against your friends to create the best AI prompts
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
