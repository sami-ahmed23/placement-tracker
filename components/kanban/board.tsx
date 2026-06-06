'use client'

import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

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
const CARD_HOVER_BG = '#161616'
const COLUMN_DRAG_BG = '#0d0d0d'
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

type AnalyticsListing = {
  id: string
  status: string
  created_at: string
}

const AXIS_TICK = { fill: MUTED, fontSize: 10, fontFamily: FONT }

function reorderJobs(
  jobs: JobListing[],
  source: { droppableId: string; index: number },
  destination: { droppableId: string; index: number },
  draggableId: string
): { next: JobListing[]; statusChanged: boolean } {
  const columnMap: Record<string, JobListing[]> = {}
  for (const col of COLUMNS) {
    columnMap[col] = jobs.filter((j) => j.status === col)
  }

  const sourceColumn = columnMap[source.droppableId]
  const [removed] = sourceColumn.splice(source.index, 1)
  if (!removed || removed.id !== draggableId) {
    return { next: jobs, statusChanged: false }
  }

  const newStatus = destination.droppableId
  const updated = { ...removed, status: newStatus }
  columnMap[destination.droppableId].splice(destination.index, 0, updated)

  return {
    next: COLUMNS.flatMap((col) => columnMap[col]),
    statusChanged: source.droppableId !== destination.droppableId,
  }
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

function AnalyticsOverlay({ onClose }: { onClose: () => void }) {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['analytics_listings'],
    queryFn: async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session?.user.id) return []
      const { data } = await supabaseClient
        .from('job_listings')
        .select('id, status, created_at')
        .eq('user_id', session.user.id)
      return (data ?? []) as AnalyticsListing[]
    },
  })

  const statusData = COLUMNS.map((col) => ({
    status: col.replace(/_/g, ' '),
    count: listings.filter((l) => l.status === col).length,
  }))

  const cumulativeData = (() => {
    const byDate: Record<string, number> = {}
    for (const l of listings) {
      const date = l.created_at.slice(0, 10)
      byDate[date] = (byDate[date] || 0) + 1
    }
    let cumulative = 0
    return Object.keys(byDate)
      .sort()
      .map((date) => {
        cumulative += byDate[date]
        return { date, count: cumulative }
      })
  })()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '700px',
          maxHeight: '80vh',
          background: CARD_BG,
          border: '1px solid #222',
          borderRadius: 0,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <h2
          id="analytics-title"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: FG,
            margin: '0 0 24px 0',
          }}
        >
          Analytics
        </h2>

        {isLoading ? (
          <p
            style={{
              fontSize: '10px',
              color: MUTED,
              letterSpacing: '0.1em',
              margin: 0,
            }}
          >
            LOADING...
          </p>
        ) : (
          <>
            <p
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: MUTED,
                margin: '0 0 12px 0',
              }}
            >
              Status breakdown
            </p>
            <div style={{ background: BG, marginBottom: '32px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <XAxis
                    dataKey="status"
                    tick={AXIS_TICK}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Bar dataKey="count" fill={ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: MUTED,
                margin: '0 0 12px 0',
              }}
            >
              Applications over time
            </p>
            <div style={{ background: BG }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cumulativeData}>
                  <XAxis
                    dataKey="date"
                    tick={AXIS_TICK}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={ACCENT}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function JobDetailModal({
  job,
  onClose,
}: {
  job: JobListing
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleDeleteConfirm() {
    const { error } = await supabaseClient
      .from('job_listings')
      .delete()
      .eq('id', job.id)

    if (error) return

    queryClient.invalidateQueries({ queryKey: ['job_listings'] })
    onClose()
  }

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

          <div
            style={{
              borderTop: '1px solid #222222',
              marginTop: '20px',
              paddingTop: '16px',
            }}
          >
            {confirmingDelete ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#EF4444',
                    fontFamily: FONT,
                  }}
                >
                  DELETE PERMANENTLY?
                </span>
                <button
                  type="button"
                  onClick={() => void handleDeleteConfirm()}
                  style={{
                    fontFamily: FONT,
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#EF4444',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  CONFIRM
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    fontFamily: FONT,
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                style={{
                  fontFamily: FONT,
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#EF4444',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                DELETE LISTING
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null)
  const [modalJob, setModalJob] = useState<JobListing | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null)
    })
  }, [])

  const { data: queryJobs = [], isLoading } = useQuery({
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

  useEffect(() => {
    if (isDraggingRef.current) return
    setJobs(queryJobs)
  }, [queryJobs])

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  function handleDragStart() {
    isDraggingRef.current = true
    setIsDragging(true)
  }

  function handleDragEnd({ destination, draggableId, source }: DropResult) {
    if (!destination) {
      isDraggingRef.current = false
      setIsDragging(false)
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      isDraggingRef.current = false
      setIsDragging(false)
      return
    }

    const previousJobs = jobs
    const { next, statusChanged } = reorderJobs(
      jobs,
      source,
      destination,
      draggableId
    )

    flushSync(() => {
      setJobs(next)
    })

    isDraggingRef.current = false
    setIsDragging(false)

    if (!statusChanged) return

    const newStatus = destination.droppableId
    queryClient.setQueryData(['job_listings'], next)

    void (async () => {
      const { error } = await supabaseClient
        .from('job_listings')
        .update({ status: newStatus })
        .eq('id', draggableId)

      if (error) {
        setJobs(previousJobs)
        queryClient.setQueryData(['job_listings'], previousJobs)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['job_listings'] })
    })()
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
        ${isDragging ? '* { user-select: none; }' : ''}
      `}</style>

      <div
        style={{
          position: 'relative',
          zIndex: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: BG,
          color: FG,
          fontFamily: FONT,
          filter: showAnalytics ? 'blur(4px)' : undefined,
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
            zIndex: 1000,
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
              onClick={() => setShowAnalytics(true)}
              style={{
                fontFamily: FONT,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: MUTED,
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
                e.currentTarget.style.color = MUTED
              }}
            >
              ANALYTICS
            </button>
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

        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        position: 'relative',
                        flex: '1 0 200px',
                        minWidth: '200px',
                        height: '100%',
                        background: snapshot.isDraggingOver ? COLUMN_DRAG_BG : BG,
                        borderLeft: snapshot.isDraggingOver
                          ? `2px solid ${ACCENT}`
                          : '2px solid transparent',
                        boxSizing: 'border-box',
                        paddingTop: '40px',
                        paddingRight: '1rem',
                        paddingBottom: '1.5rem',
                        paddingLeft: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '1rem',
                          right: '1rem',
                          height: '40px',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
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
                              {(provided, snapshot) => {
                                const isFocused = focusedCardId === job.id

                                return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() =>
                                    setFocusedCardId((prev) =>
                                      prev === job.id ? null : job.id
                                    )
                                  }
                                  onMouseEnter={() => setHoveredCardId(job.id)}
                                  onMouseLeave={() => setHoveredCardId(null)}
                                  style={{
                                    position: 'relative',
                                    borderLeft: isFocused
                                      ? `2px solid ${ACCENT}`
                                      : `2px solid ${STATUS_BORDER[job.status] ?? MUTED}`,
                                    background:
                                      hoveredCardId === job.id && !snapshot.isDragging
                                        ? CARD_HOVER_BG
                                        : CARD_BG,
                                    padding: '10px 28px 10px 12px',
                                    marginBottom: '8px',
                                    cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                    userSelect: 'none',
                                    opacity: snapshot.isDragging ? 0.85 : 1,
                                    boxShadow: snapshot.isDragging
                                      ? '0 8px 24px rgba(0,0,0,0.4)'
                                      : 'none',
                                    outline: snapshot.isDragging
                                      ? `1px solid ${ACCENT}`
                                      : 'none',
                                    transition: snapshot.isDragging
                                      ? undefined
                                      : 'background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                                    ...provided.draggableProps.style,
                                    zIndex: snapshot.isDragging ? 1 : 0,
                                  }}
                                >
                                  <button
                                    type="button"
                                    aria-label="View job details"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setModalJob(job)
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      background: 'transparent',
                                      border: 'none',
                                      color: MUTED,
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      lineHeight: 1,
                                      padding: 0,
                                      fontFamily: FONT,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = ACCENT
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = MUTED
                                    }}
                                  >
                                    ⓘ
                                  </button>
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
                                )
                              }}
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

      {modalJob && (
        <JobDetailModal
          job={modalJob}
          onClose={() => setModalJob(null)}
        />
      )}

      {showAnalytics && (
        <AnalyticsOverlay onClose={() => setShowAnalytics(false)} />
      )}
    </>
  )
}
