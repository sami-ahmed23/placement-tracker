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

const STATUS_BORDER: Record<string, string> = {
  CAPTURED: '#444444',
  SCOUTING: '#555555',
  ANALYSING: '#666666',
  AUDITING: '#777777',
  RED_FLAG_DETECTED: '#884444',
  AUDIT_PASSED: '#448866',
  SCORING: '#888888',
  VERDICT_PENDING: '#999999',
  PROCEED: '#00ffd1',
  OBSERVE: '#887744',
  DISCARD: '#664444',
}

const columnHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  color: '#444444',
  margin: 0,
  textTransform: 'uppercase',
  paddingBottom: '1.5rem',
}

export function KanbanBoard() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['job_listings'],
    queryFn: async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      const { data } = await supabaseClient
        .from('job_listings')
        .select('id, company, role, status, nexus_score, verdict')
        .eq('user_id', session?.user.id)
      return data as JobListing[]
    },
  })

  if (isLoading) {
    return (
      <p
        style={{
          color: '#444444',
          padding: '2rem',
          fontSize: '12px',
          letterSpacing: '0.1em',
          margin: 0,
        }}
      >
        LOADING...
      </p>
    )
  }

  return (
    <DragDropContext onDragEnd={() => {}}>
      <div
        style={{
          display: 'flex',
          gap: '1px',
          overflowX: 'auto',
          height: '100vh',
          background: '#222222',
        }}
      >
        {COLUMNS.map((col) => (
          <Droppable key={col} droppableId={col}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: '1 0 200px',
                  minWidth: '200px',
                  height: '100vh',
                  background: '#080808',
                  padding: '1.5rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <h3 style={columnHeaderStyle}>{col.replace(/_/g, ' ')}</h3>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '10px',
                      color: '#444444',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {jobs.filter((j) => j.status === col).length}
                  </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {jobs
                    .filter((j) => j.status === col)
                    .map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              borderLeft: `2px solid ${STATUS_BORDER[job.status] ?? '#444444'}`,
                              background: '#0f0f0f',
                              padding: '10px 12px',
                              marginBottom: '1px',
                              cursor: 'grab',
                              outline: snapshot.isDragging
                                ? '1px solid #00ffd1'
                                : 'none',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#e8e8e8',
                                margin: '0 0 4px 0',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {job.company.toUpperCase()}
                            </p>
                            <p
                              style={{
                                fontSize: '10px',
                                color: '#444444',
                                margin: '0 0 8px 0',
                              }}
                            >
                              {job.role}
                            </p>
                            <span
                              style={{
                                fontSize: '9px',
                                color: '#444444',
                                letterSpacing: '0.1em',
                              }}
                            >
                              [{job.status.replace(/_/g, ' ')}]
                            </span>
                            {job.nexus_score != null && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  color: '#e8e8e8',
                                  marginLeft: '8px',
                                  letterSpacing: '0.1em',
                                }}
                              >
                                {job.nexus_score}
                              </span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
