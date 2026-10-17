import { Category, Issue, IssueDetails, Status } from '../types';

// IP компьютера в твоей Wi-Fi сети. Если сменится, поменяй здесь.
export const API_URL = 'http://192.168.0.18:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

const digits = (s: string) => s.replace(/\D/g, '');

export interface CreateIssueBody {
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  title?: string;
  comment?: string;
}

export interface ConfirmBody {
  lat: number;
  lng: number;
  comment?: string;
}

export interface MyReport {
  id: string;
  comment: string | null;
  createdAt: string;
}

export type MyIssue = Issue & { reports: MyReport[] };

export const api = {
  listIssues: (lat?: number, lng?: number) =>
    request<Issue[]>(lat !== undefined && lng !== undefined ? `/issues?lat=${lat}&lng=${lng}` : '/issues'),
  getIssue: (id: string) => request<IssueDetails>(`/issues/${id}`),
  createIssue: (body: CreateIssueBody) =>
    request<Issue>('/issues', { method: 'POST', body: JSON.stringify(body) }),
  confirmIssue: (id: string, body: ConfirmBody) =>
    request<Issue>(`/issues/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
  verifyIssue: (id: string, fixed: boolean) =>
    request<Issue>(`/issues/${id}/verify`, { method: 'POST', body: JSON.stringify({ fixed }) }),
  setStatus: (id: string, status: Status) =>
    request<Issue>(`/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // фото и "мои обращения"
  uploadPhoto: (id: string, photo: string) =>
    request<{ ok: boolean }>(`/issues/${id}/photo`, { method: 'POST', body: JSON.stringify({ photo }) }),
  claim: (id: string, body: { phone: string; lat: number; lng: number; comment?: string }) =>
    request<{ reportId: string }>(`/issues/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ ...body, phone: digits(body.phone) }),
    }),
  myIssues: (phone: string) => request<MyIssue[]>(`/me/issues?phone=${digits(phone)}`),
  editMyReport: (reportId: string, phone: string, comment: string) =>
    request<{ ok: boolean }>(`/me/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ phone: digits(phone), comment }),
    }),
  deleteMyReport: (reportId: string, phone: string) =>
    request<{ deleted: string }>(`/me/reports/${reportId}?phone=${digits(phone)}`, { method: 'DELETE' }),

  // подтверждение номера телефона
  requestCode: (phone: string) =>
    request<{ ok: boolean; devCode?: string }>('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ phone: digits(phone) }),
    }),
  verifyCode: (phone: string, code: string) =>
    request<{ ok: boolean }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone: digits(phone), code }),
    }),
};