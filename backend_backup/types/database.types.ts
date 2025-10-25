export type GameRoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished'

export interface Profile {
  id: string
  username: string
  wins: number
  losses: number
  created_at: string
}

export interface GameRoom {
  id: string
  room_code: string
  host_id: string
  status: GameRoomStatus
  max_players: number
  countdown_duration: number
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface GameParticipant {
  id: string
  room_id: string
  user_id: string
  is_ready: boolean
  prompt: string | null
  submitted_at: string | null
  joined_at: string
}

export interface GameResult {
  id: string
  room_id: string
  winner_id: string | null
  player1_id: string | null
  player2_id: string | null
  player1_score: number
  player2_score: number
  judge_reasoning: string
  created_at: string
}

// Extended types with relations
export interface ParticipantWithProfile extends GameParticipant {
  profile?: Profile
}

export interface GameRoomWithParticipants extends GameRoom {
  participants: ParticipantWithProfile[]
}

export interface GameResultWithProfiles extends GameResult {
  player1?: Profile
  player2?: Profile
  winner?: Profile
}
