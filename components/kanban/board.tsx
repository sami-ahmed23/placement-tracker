'use client'

import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '@/lib/supabase'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const COLUMNS = [
  'CAPTURED',
  'SCOUTING',
  'ANALYSING',
  'AUDITING',
  'SCORING',
  'VERDICT_PENDING',
  'PROCEED',
  'OBSERVE',
  'DISCARD',
]

type JobListing = {
  id: string
  company: string
  role: string
  status: string
  nexus_score: number | null
  verdict: string | null
}

function getStatusColour(status: string) {
  const map: Record<string, string> = {
    CAPTURED: 'bg-zinc-700 text-zinc-300',
    SCOUTING: 'bg-blue-900 text-blue-300',
    ANALYSING: 'bg-purple-900 text-purple-300',
    AUDITING: 'bg-yellow-900 text-yellow-300',
    RED_FLAG_DETECTED: 'bg-red-900 text-red-300',
    AUDIT_PASSED: 'bg-green-900 text-green-300',
    SCORING: 'bg-teal-900 text-teal-300',
    PROCEED: 'bg-green-900 text-green-300',
    OBSERVE: 'bg-yellow-900 text-yellow-300',
    DISCARD: 'bg-red-900 text-red-300',
  }
  return map[status] ?? 'bg-zinc-700 text-zinc-300'
}

export function KanbanBoard() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['job_listings'],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from('job_listings')
        .select('id, company, role, status, nexus_score, verdict')
      return data as JobListing[]
    },
  })

  if (isLoading) return <p className="p-8 text-muted-foreground">Loading...</p>

  return (
    <DragDropContext onDragEnd={() => {}}>
      <div className="flex gap-4 p-8 overflow-x-auto">
        {COLUMNS.map((col) => (
          <Droppable key={col} droppableId={col}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-w-[220px] bg-zinc-900 rounded-lg p-4"
              >
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
                  {col.replace('_', ' ')}
                </h3>
                {jobs
                  .filter((j) => j.status === col)
                  .map((job, index) => (
                    <Draggable key={job.id} draggableId={job.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-zinc-800 rounded p-3 mb-2"
                        >
                          <p className="text-sm font-medium">{job.company}</p>
                          <p className="text-xs text-zinc-400 mb-2">{job.role}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColour(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}