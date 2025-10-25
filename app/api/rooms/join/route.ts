import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Parse request body
    const body = await request.json()
    const { roomCode } = body

    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      )
    }

    // Validate room code format (6 digits)
    if (!/^\d{6}$/.test(roomCode)) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      )
    }

    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if room is in waiting status
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Room is not accepting new players' },
        { status: 400 }
      )
    }

    // Check current participant count
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('id')
      .eq('room_id', room.id)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to check room capacity' },
        { status: 500 }
      )
    }

    // Check if room is full
    if (participants && participants.length >= room.max_players) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      )
    }

    // Check if user is already in the room
    const { data: existingParticipant } = await supabase
      .from('game_participants')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You are already in this room' },
        { status: 400 }
      )
    }

    // Add user as participant
    const { data: participant, error: joinError } = await supabase
      .from('game_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        is_ready: false,
      })
      .select()
      .single()

    if (joinError) {
      console.error('Error joining room:', joinError)
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      room,
      participant,
      message: 'Joined room successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
