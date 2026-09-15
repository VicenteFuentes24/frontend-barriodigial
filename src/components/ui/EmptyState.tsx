import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="state-box">
      <Inbox className="state-icon" aria-hidden="true" />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
