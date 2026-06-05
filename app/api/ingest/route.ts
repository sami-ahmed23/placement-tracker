import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase-server'

const ingestSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  salary: z.string().nullable().optional(),
  tech_stack: z.array(z.string()),
  url: z.string().url(),
  raw_html: z.string(),
})

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = await request.json()
  const result = ingestSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('job_listings')
    .insert({
      ...result.data,
      status: 'CAPTURED',
      user_id: user.id,
    })
    .select('id, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}