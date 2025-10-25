import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Generate a random 6-digit room code
function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate unique room code
    let roomCode = generateRoomCode()
    let isUnique = false

    // Ensure room code is unique
    while (!isUnique) {
      const { data: existingRoom } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .eq('status', 'waiting')
        .single()

      if (!existingRoom) {
        isUnique = true
      } else {
        roomCode = generateRoomCode()
      }
    }

    // this should never happen lol
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code' },
        { status: 500 }
      )
    }

    // Create game room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        host_id: user.id,
        status: 'waiting',
      })
      .select()
      .single()

    if (roomError) {
      console.error('Error creating room:', roomError)
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      )
    }

    // Add host as first participant
    const { error: participantError } = await supabase
      .from('game_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        is_ready: false,
      })

    if (participantError) {
      console.error('Error adding participant:', participantError)
      // Cleanup: delete the room if participant creation fails
      await supabase.from('game_rooms').delete().eq('id', room.id)
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      room,
      message: 'Room created successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
