'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { KanbanBoard } from '@/components/kanban/board'
import { RealtimeProvider } from '@/components/kanban/realtime'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    })
  }, [router])

  if (loading) return null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <RealtimeProvider />
      <KanbanBoard />
    </main>
  )
}