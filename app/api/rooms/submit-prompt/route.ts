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
    const { roomId, prompt } = body

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Verify room exists and is in playing status
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

    if (room.status !== 'playing') {
      return NextResponse.json(
        { error: 'Cannot submit prompt when game is not in playing state' },
        { status: 400 }
      )
    }

    // Verify user is a participant in the room
    const { data: participant, error: participantError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this room' },
        { status: 403 }
      )
    }

    // Check if participant has already submitted
    if (participant.prompt !== null) {
      return NextResponse.json(
        { error: 'You have already submitted a prompt' },
        { status: 400 }
      )
    }

    // Update participant with prompt
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('game_participants')
      .update({
        prompt: prompt.trim(),
        submitted_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error submitting prompt:', updateError)
      return NextResponse.json(
        { error: 'Failed to submit prompt' },
        { status: 500 }
      )
    }

    // Check if all participants have submitted
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)

    if (allParticipantsError) {
      console.error('Error fetching participants:', allParticipantsError)
      return NextResponse.json(
        { error: 'Failed to check submission status' },
        { status: 500 }
      )
    }

    const allSubmitted = allParticipants &&
      allParticipants.every(p => p.prompt !== null)

    return NextResponse.json({
      participant: updatedParticipant,
      allSubmitted,
      message: allSubmitted
        ? 'All prompts submitted! Ready for judging...'
        : 'Prompt submitted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
