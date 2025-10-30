export type StateCode = 'OH'|'MI'|'FL'|'GA'|'NY'|'MO'|'KS'|'LA';

export type PacketDoc = {
  key: string; // e.g., w4, i9_s1, direct_deposit
  label: string;
  required: boolean;
};

export type HiringPacket = {
  type: 'employee'|'contractor'|'executive';
  arbitration: boolean;
  states: Record<StateCode, PacketDoc[]>;
};

const CORE: PacketDoc[] = [
  { key: 'i9_section1', label: 'Form I-9 (Section 1)', required: true },
  { key: 'i9_section2', label: 'Form I-9 (Section 2)', required: true },
  { key: 'w4', label: 'Federal W-4', required: true },
  { key: 'direct_deposit', label: 'Direct Deposit Authorization', required: false },
  { key: 'eeo', label: 'EEO Voluntary Self-Identification', required: false },
  { key: 'emergency_contact', label: 'Emergency Contact', required: true },
  { key: 'offer_ack', label: 'Offer/At-will Acknowledgment', required: true },
  { key: 'handbook_ack', label: 'Employee Handbook Acknowledgment', required: true },
  { key: 'conf_ip', label: 'Confidentiality & IP Assignment', required: true },
  { key: 'it_acceptable_use', label: 'IT & Acceptable Use', required: true },
  { key: 'arbitration', label: 'Arbitration Agreement', required: true },
];

const STATE_TAX: Record<StateCode, PacketDoc[]> = {
  OH: [{ key: 'oh_it4', label: 'Ohio IT 4', required: true }, { key: 'oh_pay_notice', label: 'Ohio Pay Notice', required: true }],
  MI: [{ key: 'mi_w4', label: 'Michigan W4-MI', required: true }],
  FL: [],
  GA: [{ key: 'ga_g4', label: 'Georgia G-4', required: true }],
  NY: [{ key: 'ny_it2104', label: 'New York IT-2104', required: true }, { key: 'ny_pay_notice', label: 'NY Wage Theft Prevention Notice', required: true }],
  MO: [],
  KS: [{ key: 'ks_k4', label: 'Kansas K-4', required: true }],
  LA: [],
};

export const DEFAULT_EMPLOYEE_PACKET: HiringPacket = {
  type: 'employee',
  arbitration: true,
  states: (Object.keys(STATE_TAX) as StateCode[]).reduce((acc, s) => {
    acc[s] = [...CORE, ...STATE_TAX[s]];
    return acc;
  }, {} as Record<StateCode, PacketDoc[]>)
};


