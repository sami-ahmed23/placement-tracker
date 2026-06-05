'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '@/lib/supabase'

export function RealtimeProvider() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabaseClient
      .channel('job-listing-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_listings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['job_listings'] })
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [queryClient])

  return null
}