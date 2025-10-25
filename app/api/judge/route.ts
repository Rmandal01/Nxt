import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

    if (participantsError || !participants || participants.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid number of participants' },
        { status: 400 }
      )
    }

    // Verify both players have submitted prompts
    if (!participants[0].prompt || !participants[1].prompt) {
      return NextResponse.json(
        { error: 'Not all players have submitted prompts' },
        { status: 400 }
      )
    }

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

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Create judging prompt
    const judgingPrompt = `You are judging a creative prompt battle between two players.
Please evaluate the following two prompts based on creativity, originality, clarity, and engagement.

Player 1's Prompt:
"${participants[0].prompt}"

Player 2's Prompt:
"${participants[1].prompt}"

Please respond in the following JSON format:
{
  "winner": 1 or 2,
  "player1_score": <score out of 100>,
  "player2_score": <score out of 100>,
  "reasoning": "<detailed explanation of your judgment>"
}

Be fair, objective, and provide constructive feedback in your reasoning.`

    // Get AI judgment
    const result = await model.generateContent(judgingPrompt)
    const response = await result.response
    const text = response.text()

    // Parse AI response
    let judgment
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      judgment = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('AI response:', text)
      return NextResponse.json(
        { error: 'Failed to parse AI judgment' },
        { status: 500 }
      )
    }

    // Validate judgment structure
    if (
      typeof judgment.winner !== 'number' ||
      typeof judgment.player1_score !== 'number' ||
      typeof judgment.player2_score !== 'number' ||
      typeof judgment.reasoning !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid AI judgment format' },
        { status: 500 }
      )
    }

    // Determine winner
    const winnerId = judgment.winner === 1
      ? participants[0].user_id
      : participants[1].user_id

    // Save game result
    const { data: gameResult, error: resultError } = await supabase
      .from('game_results')
      .insert({
        room_id: roomId,
        winner_id: winnerId,
        player1_id: participants[0].user_id,
        player2_id: participants[1].user_id,
        player1_score: judgment.player1_score,
        player2_score: judgment.player2_score,
        judge_reasoning: judgment.reasoning,
      })
      .select()
      .single()

    if (resultError) {
      console.error('Error saving game result:', resultError)
      return NextResponse.json(
        { error: 'Failed to save game result' },
        { status: 500 }
      )
    }

    // Update room status to finished
    const { error: updateRoomError } = await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString(),
      })
      .eq('id', roomId)

    if (updateRoomError) {
      console.error('Error updating room status:', updateRoomError)
    }

    // Update player stats
    for (const participant of participants) {
      const isWinner = participant.user_id === winnerId
      
      // Get current stats
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('wins, losses')
        .eq('id', participant.user_id)
        .single()

      if (fetchError) {
        console.error('Error fetching current stats:', fetchError)
        continue
      }

      const newWins = isWinner ? (currentProfile.wins || 0) + 1 : (currentProfile.wins || 0)
      const newLosses = !isWinner ? (currentProfile.losses || 0) + 1 : (currentProfile.losses || 0)

      const { error: statsError } = await supabase
        .from('profiles')
        .update({
          wins: newWins,
          losses: newLosses
        })
        .eq('id', participant.user_id)

      if (statsError) {
        console.error('Error updating player stats:', statsError)
      }
    }

    return NextResponse.json({
      result: gameResult,
      winner: winnerId,
      scores: {
        player1: judgment.player1_score,
        player2: judgment.player2_score,
      },
      reasoning: judgment.reasoning,
      message: 'Game judged successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
