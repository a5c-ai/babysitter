import { KanbanBoard } from '@a5c-ai/genty-ui/kanban';

export function KanbanPage() {
  return (
    <div>
      <h2 style={{ margin: '0 0 1rem' }}>Kanban</h2>
      <KanbanBoard org="default" initialIssues={[]} />
    </div>
  );
}
