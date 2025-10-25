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
    const { roomId } = body

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json(
        { error: 'Room ID is required' },
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
        { error: 'Game must be in playing state to judge' },
        { status: 400 }
      )
    }

    // Get all participants with their prompts
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })

    // Check if this room has already been judged
    const { data: existingResult } = await supabase
      .from('game_results')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (existingResult) {
      return NextResponse.json(
        { error: 'This game has already been judged' },
        { status: 400 }
      )
    }

    return "I like apples";
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
