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
    const { roomId, isReady } = body

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    if (typeof isReady !== 'boolean') {
      return NextResponse.json(
        { error: 'Ready status must be a boolean' },
        { status: 400 }
      )
    }

    // Verify room exists and is in waiting status
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Cannot change ready status when game is not in waiting state' },
        { status: 400 }
      )
    }

    // Update participant ready status
    const { data: participant, error: updateError } = await supabase
      .from('game_participants')
      .update({ is_ready: isReady })
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ready status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update ready status' },
        { status: 500 }
      )
    }

    // Check if all players are ready
    const { data: allParticipants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to check ready status' },
        { status: 500 }
      )
    }

    const allReady = allParticipants &&
      allParticipants.length === room.max_players &&
      allParticipants.every(p => p.is_ready)

    let updatedRoom = room

    // If all players are ready, start countdown
    if (allReady) {
      const { data: countdownRoom, error: countdownError } = await supabase
        .from('game_rooms')
        .update({
          status: 'countdown',
          started_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .single()

      if (countdownError) {
        console.error('Error starting countdown:', countdownError)
        return NextResponse.json(
          { error: 'Failed to start countdown' },
          { status: 500 }
        )
      }

      updatedRoom = countdownRoom
    }

    return NextResponse.json({
      participant,
      room: updatedRoom,
      allReady,
      message: allReady
        ? 'All players ready! Starting countdown...'
        : 'Ready status updated',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
