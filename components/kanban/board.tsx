'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
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

const FONT = '"JetBrains Mono", monospace'
const BG = '#080808'
const FG = '#e8e8e8'
const ACCENT = '#00FFD1'
const MUTED = '#444444'
const CARD_BG = '#0f0f0f'
const HEADER_HEIGHT = 40

type JobListing = {
  id: string
  company: string
  role: string
  status: string
  nexus_score: number | null
  verdict: string | null
  url: string | null
}

type AgentLog = {
  id: string
  agent_name: string
  status: string
  reasoning: string
  created_at: string
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
  PROCEED: ACCENT,
  OBSERVE: '#887744',
  DISCARD: '#664444',
}

function ExternalLinkIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 1H9V2.5M9 1L4.5 5.5M9 1V3.5H6.5"
        stroke={MUTED}
        strokeWidth="1"
      />
      <path
        d="M7 5.5V8.5H1.5V3H4.5"
        stroke={MUTED}
        strokeWidth="1"
      />
    </svg>
  )
}

function JobDetailModal({
  job,
  onClose,
}: {
  job: JobListing
  onClose: () => void
}) {
  const { data: agentLogs = [] } = useQuery({
    queryKey: ['agent_logs', job.id],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from('agent_logs')
        .select('id, agent_name, status, reasoning, created_at')
        .eq('job_id', job.id)
        .order('created_at', { ascending: true })
      return (data ?? []) as AgentLog[]
    },
    enabled: !!job.id,
  })

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '2rem',
        fontFamily: FONT,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '80vh',
          background: CARD_BG,
          border: '1px solid #222222',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: '1px solid #222222',
            color: MUTED,
            fontFamily: FONT,
            fontSize: '10px',
            letterSpacing: '0.1em',
            padding: '4px 8px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = ACCENT
            e.currentTarget.style.borderColor = ACCENT
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = MUTED
            e.currentTarget.style.borderColor = '#222222'
          }}
        >
          CLOSE
        </button>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <h2
            id="job-modal-title"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: FG,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 32px 8px 0',
            }}
          >
            {job.company}
          </h2>

          <p
            style={{
              fontSize: '11px',
              color: MUTED,
              margin: '0 0 16px 0',
            }}
          >
            {job.role}
          </p>

          {job.url && (
            <p style={{ margin: '0 0 16px 0' }}>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '10px',
                  color: ACCENT,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                }}
              >
                {job.url}
              </a>
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: FG,
                border: `1px solid ${STATUS_BORDER[job.status] ?? MUTED}`,
                padding: '4px 8px',
              }}
            >
              {job.status.replace(/_/g, ' ')}
            </span>
            {job.nexus_score != null && (
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: FG,
                  border: '1px solid #222222',
                  padding: '4px 8px',
                }}
              >
                NEXUS {job.nexus_score}
              </span>
            )}
            {job.verdict && (
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: FG,
                  border: `1px solid ${STATUS_BORDER[job.verdict] ?? MUTED}`,
                  padding: '4px 8px',
                }}
              >
                {job.verdict}
              </span>
            )}
          </div>

          {agentLogs.length > 0 && (
            <div
              style={{
                borderTop: '1px solid #222222',
                paddingTop: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '9px',
                  color: MUTED,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  margin: '0 0 12px 0',
                }}
              >
                AGENT REASONING
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {agentLogs.map((log) => (
                  <p
                    key={log.id}
                    style={{
                      fontSize: '10px',
                      fontFamily: FONT,
                      color: MUTED,
                      margin: 0,
                      lineHeight: 1.5,
                      letterSpacing: '0.02em',
                    }}
                  >
                    [{log.agent_name.toUpperCase()}] {log.status.toUpperCase()}{' '}
                    – {log.reasoning}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null)
    })
  }, [])

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['job_listings'],
    queryFn: async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      const { data } = await supabaseClient
        .from('job_listings')
        .select('id, company, role, status, nexus_score, verdict, url')
        .eq('user_id', session?.user.id)
      return data as JobListing[]
    },
  })

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <p
        style={{
          fontFamily: FONT,
          color: MUTED,
          padding: '2rem',
          fontSize: '12px',
          letterSpacing: '0.1em',
          margin: 0,
          background: BG,
        }}
      >
        LOADING...
      </p>
    )
  }

  return (
    <>
      <style>{`
        @keyframes agent-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        .agent-pulse-dot {
          animation: agent-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: BG,
          color: FG,
          fontFamily: FONT,
        }}
      >
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: `${HEADER_HEIGHT}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: BG,
            borderBottom: '1px solid #222222',
            zIndex: 50,
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: FG,
            }}
          >
            PLACEMENT TRACKER
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {userEmail && (
              <span
                style={{
                  fontSize: '10px',
                  color: MUTED,
                  letterSpacing: '0.05em',
                }}
              >
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                fontFamily: FONT,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: FG,
                background: 'transparent',
                border: '1px solid #222222',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = ACCENT
                e.currentTarget.style.color = ACCENT
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#222222'
                e.currentTarget.style.color = FG
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        <DragDropContext onDragEnd={() => {}}>
          <div
            style={{
              display: 'flex',
              gap: '1px',
              overflowX: 'auto',
              flex: 1,
              minHeight: 0,
              marginTop: `${HEADER_HEIGHT}px`,
              background: '#222222',
            }}
          >
            {COLUMNS.map((col) => {
              const columnJobs = jobs.filter((j) => j.status === col)
              const hasActiveCards = columnJobs.length > 0
              const dotColor = STATUS_BORDER[col] ?? MUTED

              return (
                <Droppable key={col} droppableId={col}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: '1 0 200px',
                        minWidth: '200px',
                        height: '100%',
                        background: BG,
                        padding: '1.5rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                          paddingBottom: '1.5rem',
                        }}
                      >
                        <span
                          className={hasActiveCards ? 'agent-pulse-dot' : undefined}
                          style={{
                            width: '6px',
                            height: '6px',
                            background: dotColor,
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                        <h3
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.15em',
                            color: MUTED,
                            margin: 0,
                            textTransform: 'uppercase',
                          }}
                        >
                          {col.replace(/_/g, ' ')}
                        </h3>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '10px',
                            color: MUTED,
                            letterSpacing: '0.15em',
                          }}
                        >
                          {columnJobs.length}
                        </span>
                      </div>

                      <div
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {columnJobs.length === 0 ? (
                          <p
                            style={{
                              fontSize: '10px',
                              color: MUTED,
                              textAlign: 'center',
                              margin: 'auto 0',
                              letterSpacing: '0.1em',
                            }}
                          >
                            NO LISTINGS
                          </p>
                        ) : (
                          columnJobs.map((job, index) => (
                            <Draggable
                              key={job.id}
                              draggableId={job.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedJob(job)}
                                  style={{
                                    borderLeft: `2px solid ${STATUS_BORDER[job.status] ?? MUTED}`,
                                    background: CARD_BG,
                                    padding: '10px 12px',
                                    marginBottom: '1px',
                                    cursor: 'pointer',
                                    outline: snapshot.isDragging
                                      ? `1px solid ${ACCENT}`
                                      : 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    <p
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: FG,
                                        margin: 0,
                                        letterSpacing: '0.05em',
                                      }}
                                    >
                                      {job.company.toUpperCase()}
                                    </p>
                                    {job.url && (
                                      <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open listing"
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          lineHeight: 0,
                                          flexShrink: 0,
                                        }}
                                        onMouseEnter={(e) => {
                                          const paths =
                                            e.currentTarget.querySelectorAll(
                                              'path'
                                            )
                                          paths.forEach((p) => {
                                            ;(
                                              p as SVGPathElement
                                            ).style.stroke = ACCENT
                                          })
                                        }}
                                        onMouseLeave={(e) => {
                                          const paths =
                                            e.currentTarget.querySelectorAll(
                                              'path'
                                            )
                                          paths.forEach((p) => {
                                            ;(
                                              p as SVGPathElement
                                            ).style.stroke = MUTED
                                          })
                                        }}
                                      >
                                        <ExternalLinkIcon />
                                      </a>
                                    )}
                                  </div>
                                  <p
                                    style={{
                                      fontSize: '10px',
                                      color: MUTED,
                                      margin: '0 0 8px 0',
                                    }}
                                  >
                                    {job.role}
                                  </p>
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      color: MUTED,
                                      letterSpacing: '0.1em',
                                    }}
                                  >
                                    [{job.status.replace(/_/g, ' ')}]
                                  </span>
                                  {job.nexus_score != null && (
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        color: FG,
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
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </>
  )
}
