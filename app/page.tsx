import { KanbanBoard } from '@/components/kanban/board'
import { RealtimeProvider } from '@/components/kanban/realtime'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <RealtimeProvider />
      <KanbanBoard />
    </main>
  )
}