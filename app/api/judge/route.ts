import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

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

    if (participantsError || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found' },
        { status: 404 }
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

    // Define the schema for judging criteria
    const participantScoreSchema = z.object({
      participant_id: z.string(),
      creativity_score: z.number().min(0).max(10).describe('How creative and imaginative is this prompt? (0-10)'),
      effectiveness_score: z.number().min(0).max(10).describe('How effective would this prompt be at achieving the goal? (0-10)'),
      clarity_score: z.number().min(0).max(10).describe('How clear and well-structured is this prompt? (0-10)'),
      originality_score: z.number().min(0).max(10).describe('How original and unique is this approach? (0-10)'),
      feedback: z.string().describe('Brief constructive feedback (2-3 sentences)'),
    })

    const judgingSchema = z.object({
      winner_id: z.string().describe('The user_id of the winning participant'),
      reasoning: z.string().describe('Overall reasoning for the winner selection (3-4 sentences)'),
      scores: z.array(participantScoreSchema).describe('Individual scores for each participant'),
    })

    // Prepare the prompt for AI judging
    const participantPrompts = participants
      .map((p, idx) => `
Participant ${idx + 1} (ID: ${p.user_id}):
Prompt: ${p.prompt || 'No prompt submitted'}
      `)
      .join('\n\n')

    const judgingPrompt = `You are an expert judge for a prompt engineering battle. The battle topic is: "${room.topic}"

Evaluate each participant's prompt based on these criteria:
1. **Creativity (0-10)**: How creative and imaginative is the prompt?
2. **Effectiveness (0-10)**: How well would this prompt achieve the intended goal?
3. **Clarity (0-10)**: How clear, well-structured, and easy to understand is it?
4. **Originality (0-10)**: How unique and innovative is the approach?

Here are the participants and their prompts:
${participantPrompts}

Please provide:
1. Individual scores for each participant across all criteria
2. Brief constructive feedback for each participant (2-3 sentences)
3. The winner (participant with highest total score)
4. Overall reasoning for selecting the winner (3-4 sentences)

Be fair, objective, and consider all criteria equally. The winner should have the highest combined score across all categories.`

    // Use AI to judge the prompts
    const { object: judgingResult } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: judgingSchema,
      prompt: judgingPrompt,
    })

    // Calculate total scores
    const scoresWithTotals = judgingResult.scores.map(score => ({
      ...score,
      total_score: score.creativity_score + score.effectiveness_score + score.clarity_score + score.originality_score
    }))

    // Create the game result
    const { data: gameResult, error: resultError } = await supabase
      .from('game_results')
      .insert({
        room_id: roomId,
        winner_id: judgingResult.winner_id,
        judge_reasoning: judgingResult.reasoning,
      })
      .select()
      .single()

    if (resultError) {
      console.error('Error creating game result:', resultError)
      return NextResponse.json(
        { error: 'Failed to save game result' },
        { status: 500 }
      )
    }

    // Insert participant scores
    const participantScoresToInsert = scoresWithTotals.map(score => {
      const participant = participants.find(p => p.user_id === score.participant_id)
      return {
        result_id: gameResult.id,
        participant_id: participant?.id,
        creativity_score: score.creativity_score,
        effectiveness_score: score.effectiveness_score,
        clarity_score: score.clarity_score,
        originality_score: score.originality_score,
        total_score: score.total_score,
        feedback: score.feedback,
      }
    })

    const { error: scoresError } = await supabase
      .from('participant_scores')
      .insert(participantScoresToInsert)

    if (scoresError) {
      console.error('Error inserting participant scores:', scoresError)
      // Don't return error, result is still saved
    }

    // Update room status to finished
    await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString()
      })
      .eq('id', roomId)

    // Update winner's profile
    await supabase.rpc('increment_wins', { user_id: judgingResult.winner_id })

    // Update losers' profiles
    const loserIds = participants
      .filter(p => p.user_id !== judgingResult.winner_id)
      .map(p => p.user_id)

    for (const loserId of loserIds) {
      await supabase.rpc('increment_losses', { user_id: loserId })
    }

    return NextResponse.json({
      success: true,
      result: {
        ...gameResult,
        scores: scoresWithTotals,
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
