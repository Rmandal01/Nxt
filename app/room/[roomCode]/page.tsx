'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  playerCardStyles,
  avatarStyles,
  statusBadgeStyles,
  textareaStyles,
  labelStyles,
  successStyles,
  infoStyles,
  formFieldStyles
} from '@/lib/styles'

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
      <div className={backgroundGradient}>
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  if (!gameStarted) {
    // Waiting Room
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
              <h2 className="text-lg font-semibold text-gray-700">Players</h2>
              {players.map((player, index) => (
                <div key={index} className={playerCardStyles}>
                  <div className="flex items-center gap-3">
                    <div className={avatarStyles}>
                      {player[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{player}</p>
                      <p className="text-xs text-purple-600">You</p>
                    </div>
                  </div>
                  <span className={statusBadgeStyles(isReady)}>
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
                className={primaryButtonStyles}
              >
                Start Game (Demo Mode)
              </button>

              <p className={smallTextStyles}>
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

              <div className={infoStyles}>
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
