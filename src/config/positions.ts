export type PositionDef = {
  label: string;
  code: string; // slug, e.g., cfo
  department?: string;
  isExecutive?: boolean;
};

export const POSITIONS: PositionDef[] = [
  { label: 'Chief Executive Officer (CEO)', code: 'ceo', isExecutive: true },
  { label: 'Chief Financial Officer (CFO)', code: 'cfo', isExecutive: true },
  { label: 'Chief Operating Officer (COO)', code: 'coo', isExecutive: true },
  { label: 'Chief Technology Officer (CTO)', code: 'cto', isExecutive: true },
  { label: 'Chief Information Officer (CIO)', code: 'cio', isExecutive: true },
  { label: 'Marketing Director', code: 'marketing-director', department: 'Marketing' },
  { label: 'Lead Tech', code: 'lead-tech', department: 'Engineering' },
  { label: 'Procurement Manager', code: 'procurement', department: 'Operations' },
  { label: 'Maintenance Manager', code: 'maintenance', department: 'Operations' },
  { label: 'HR Manager', code: 'hr-manager', department: 'HR' },
];

export function buildEmails(first: string, last: string, code: string, domain: string) {
  const f = (first || '').trim().toLowerCase();
  const l = (last || '').trim().toLowerCase();
  const base = `${f[0] || ''}${l}`.replace(/[^a-z0-9]/g, '');
  const named = `${base}.${code}@${domain}`;
  const roleAlias = `${code}@${domain}`;
  return { named, roleAlias };
}


