import { useNavigate } from 'react-router-dom';
import { AgentDirectory } from '@a5c-ai/genty-ui/agent';

export function AgentsPage() {
  const navigate = useNavigate();
  return (
    <AgentDirectory
      org="default"
      profiles={[]}
      onNavigate={(path) => navigate(path)}
      newHref="/agents/new"
    />
  );
}
