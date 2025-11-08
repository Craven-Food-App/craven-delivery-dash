import { getExecutiveData, formatExecutiveForDocuments } from '@/utils/getExecutiveData';

export interface FoundersTableTarget {
  role: string;
  name: string;
  title?: string | null;
  equityPercent?: string | number | null;
  shares?: string | number | null;
  vesting?: string | null;
}

const ROLE_ORDER = ['ceo', 'cfo', 'cxo'];
const ROLE_TITLES: Record<string, string> = {
  ceo: 'Chief Executive Officer (CEO)',
  cfo: 'Chief Financial Officer (CFO)',
  cxo: 'Chief Experience Officer (CXO)',
};

const parseNumeric = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatPercent = (value: string | number | null | undefined): string => {
  if (value == null) return '0%';
  const str = value.toString().trim();
  if (!str) return '0%';
  if (str.includes('%')) return str.replace(/\s+/g, '');
  const num = parseFloat(str);
  if (Number.isNaN(num)) return str;
  const rounded = Number(num.toFixed(2));
  const base = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toString();
  return `${base.replace(/\.0+$/, '')}%`;
};

const formatShares = (value: string | number | null | undefined): string => {
  const num = parseNumeric(value);
  return num ? num.toLocaleString() : '0';
};

const formatVesting = (value: string | null | undefined): string => {
  const text = value?.trim();
  if (!text) return 'Immediate';
  return text;
};

interface RowData {
  role: string;
  name: string;
  title: string;
  equity: string;
  shares: string;
  vesting: string;
}

const buildRowData = (role: string, data?: { full_name?: string; title?: string; equity_percent?: string; shares_issued?: string; vesting_schedule?: string }): RowData => {
  const defaultTitle = ROLE_TITLES[role] || role.toUpperCase();
  return {
    role,
    name: data?.full_name || '—',
    title: data?.title || defaultTitle,
    equity: formatPercent(data?.equity_percent),
    shares: formatShares(data?.shares_issued),
    vesting: formatVesting(data?.vesting_schedule),
  };
};

const findRow = (rows: RowData[], role: string): RowData => {
  return rows.find((row) => row.role === role) ?? {
    role,
    name: '—',
    title: ROLE_TITLES[role] || role.toUpperCase(),
    equity: '0%',
    shares: '0',
    vesting: 'Immediate',
  };
};

export interface FoundersTableResult {
  tableHtml: string;
  signatureHtml: string;
  addressed: RowData;
  ceo: RowData;
  cfo: RowData;
  cxo: RowData;
  rows: RowData[];
}

export const buildFoundersTableHtml = async (target: FoundersTableTarget): Promise<FoundersTableResult> => {
  const allExecutives = await getExecutiveData();
  const formatted = allExecutives.map((exec) => formatExecutiveForDocuments(exec));

  const targetRole = target.role?.toLowerCase?.() || 'officer';
  const rows: RowData[] = [];

  const targetRow: RowData = {
    role: targetRole,
    name: target.name || '—',
    title: target.title || ROLE_TITLES[targetRole] || targetRole.toUpperCase(),
    equity: formatPercent(target.equityPercent),
    shares: formatShares(target.shares),
    vesting: formatVesting(target.vesting),
  };

  rows.push(targetRow);

  ROLE_ORDER.filter((role) => role !== targetRole).forEach((role) => {
    const existing = formatted.find((exec) => exec.role === role);
    if (existing) {
      rows.push(
        buildRowData(role, {
          full_name: existing.full_name,
          title: existing.title,
          equity_percent: existing.equity_percent,
          shares_issued: existing.shares_issued,
          vesting_schedule: existing.vesting_schedule,
        })
      );
    }
  });

  ROLE_ORDER.filter((role) => !rows.some((row) => row.role === role)).forEach((role) => {
    rows.push(buildRowData(role));
  });

  const tableHtml = rows
    .map(
      (row) =>
        `<tr><td>${row.name}</td><td>${row.title}</td><td>${row.equity}</td><td>${row.shares}</td><td>${row.vesting}</td></tr>`
    )
    .join('');

  const signatureHtml = rows
    .map(
      (row) => `
        <table class="signature">
          <tr>
            <td>
              <span class="sig-line"></span>
              <div class="sig-label">Signature of ${row.name}</div>
            </td>
            <td style="width:40px;"></td>
            <td>
              <span class="sig-line"></span>
              <div class="sig-label">Date</div>
            </td>
          </tr>
        </table>
      `
    )
    .join('');

  const ceoRow = findRow(rows, 'ceo');
  const cfoRow = findRow(rows, 'cfo');
  const cxoRow = findRow(rows, 'cxo');

  return {
    tableHtml,
    signatureHtml,
    addressed: targetRow,
    ceo: ceoRow,
    cfo: cfoRow,
    cxo: cxoRow,
    rows,
  };
};
