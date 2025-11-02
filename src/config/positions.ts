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
  { label: 'Chief Experience Officer (CXO)', code: 'cxo', isExecutive: true },
  { label: 'Chief Marketing Officer (CMO)', code: 'cmo', isExecutive: true, department: 'Marketing' },
  { label: 'Chief Revenue Officer (CRO)', code: 'cro', isExecutive: true },
  { label: 'Chief Product Officer (CPO)', code: 'cpo', isExecutive: true },
  { label: 'Chief Data Officer (CDO)', code: 'cdo', isExecutive: true },
  { label: 'Chief Human Resources Officer (CHRO)', code: 'chro', isExecutive: true },
  { label: 'Chief Legal Officer (CLO)', code: 'clo', isExecutive: true },
  { label: 'Chief Security Officer (CSO)', code: 'cso', isExecutive: true },
  { label: 'Marketing Director', code: 'marketing-director', department: 'Marketing' },
  { label: 'Marketing Manager', code: 'marketing-manager', department: 'Marketing' },
  { label: 'Senior Marketing Manager', code: 'senior-marketing-manager', department: 'Marketing' },
  { label: 'Marketing Specialist', code: 'marketing-specialist', department: 'Marketing' },
  { label: 'Content Marketing Manager', code: 'content-marketing-manager', department: 'Marketing' },
  { label: 'Digital Marketing Manager', code: 'digital-marketing-manager', department: 'Marketing' },
  { label: 'Social Media Manager', code: 'social-media-manager', department: 'Marketing' },
  { label: 'Email Marketing Specialist', code: 'email-marketing-specialist', department: 'Marketing' },
  { label: 'Brand Manager', code: 'brand-manager', department: 'Marketing' },
  { label: 'Product Marketing Manager', code: 'product-marketing-manager', department: 'Marketing' },
  { label: 'Growth Marketing Manager', code: 'growth-marketing-manager', department: 'Marketing' },
  { label: 'Marketing Coordinator', code: 'marketing-coordinator', department: 'Marketing' },
  { label: 'Marketing Analyst', code: 'marketing-analyst', department: 'Marketing' },
  { label: 'Marketing Assistant', code: 'marketing-assistant', department: 'Marketing' },
  { label: 'SEO Specialist', code: 'seo-specialist', department: 'Marketing' },
  { label: 'PPC Specialist', code: 'ppc-specialist', department: 'Marketing' },
  { label: 'Marketing Operations Manager', code: 'marketing-ops-manager', department: 'Marketing' },
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


