'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params?.roomCode as string
  const [username, setUsername] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem('username')
    if (!name) {
      router.push('/')
      return
    }
    setUsername(name)
    setPlayers([name]) // For now, just add yourself
  }, [router])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Room code copied!')
  }

  const handleReady = () => {
    setIsReady(!isReady)
  }

  const handleStartGame = () => {
    if (isReady) {
      setGameStarted(true)
    }
  }

  const handleSubmitPrompt = () => {
    if (prompt.trim()) {
      setSubmitted(true)
      alert(`Prompt submitted: "${prompt}"\n\nIn a full multiplayer game, this would be sent to the AI judge!`)
    }
  }

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  if (!gameStarted) {
    // Waiting Room
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Waiting Room
              </h1>
              <div className="bg-purple-100 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-4xl font-mono font-bold text-purple-700">{roomCode}</p>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">Players</h2>
              {players.map((player, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {player[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{player}</p>
                      <p className="text-xs text-purple-600">You</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isReady
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300" />
                  <p className="text-gray-400">Waiting for opponent...</p>
                </div>
              </div>
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

              <button
                onClick={handleStartGame}
                disabled={!isReady}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Start Game (Demo Mode)
              </button>

              <p className="text-xs text-gray-500 text-center">
                Note: This is a demo. Full multiplayer requires Supabase setup with authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Battle Arena
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Battle Arena
            </h1>
            <p className="text-gray-600">Submit your best prompt!</p>
          </div>

          {!submitted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Write a creative prompt that will impress the AI judge..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {prompt.length}/500
                </div>
              </div>

              <button
                onClick={handleSubmitPrompt}
                disabled={!prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
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
                <p className="text-blue-700 font-semibold mb-2">Demo Mode</p>
                <p className="text-sm text-blue-600">
                  In full multiplayer mode with Supabase authentication:
                </p>
                <ul className="text-xs text-blue-600 mt-2 space-y-1">
                  <li>✓ Both players submit prompts</li>
                  <li>✓ Gemini AI judges creativity and quality</li>
                  <li>✓ Winner is announced with scores</li>
                  <li>✓ Real-time updates across all players</li>
                </ul>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
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
