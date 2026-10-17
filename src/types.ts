export type Category = 'road' | 'light' | 'trash' | 'water' | 'yard';
export type Priority = 'critical' | 'medium' | 'normal';
export type Status = 'new' | 'sent' | 'in_progress' | 'done';

export interface Issue {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  confirms: number;
  escalations: number;
  address: string;
  lat: number;
  lng: number;
  department?: string | null;
  distanceM?: number | null;
}

export interface AgentLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface IssueDetails extends Issue {
  logs: AgentLogEntry[];
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'road', label: 'Дороги' },
  { key: 'light', label: 'Освещение' },
  { key: 'trash', label: 'Мусор' },
  { key: 'water', label: 'Вода и канализация' },
  { key: 'yard', label: 'Двор' },
];

export const STATUS_LABEL: Record<Status, string> = {
  new: 'Принято',
  sent: 'Передано в службу',
  in_progress: 'В работе',
  done: 'Решено',
};

export function formatDistance(m?: number | null): string {
  if (m === null || m === undefined) return '';
  return m < 1000 ? `${m} м` : `${(m / 1000).toFixed(1)} км`;
}