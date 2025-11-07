import { Company, Person, FlowOutput, Packet, RoutedDocument, SignatureSlot, Role } from '@/types/signing';

// Template mappings to your existing template system
export const TEMPLATE_MAPPINGS: Record<string, { templateKey: string; usageContext: string }> = {
  INCORPORATOR_CONSENT: { templateKey: 'pre_incorporation_consent', usageContext: 'pre_incorporation_consent' },
  INCORPORATOR_STATEMENT: { templateKey: 'incorporator_statement', usageContext: 'incorporator_statement' },
  BOARD_APPOINT_OFFICERS: { templateKey: 'board_resolution', usageContext: 'board_consent_appointment' },
  BYLAWS_ADOPTION: { templateKey: 'board_resolution', usageContext: 'board_consent_bylaws' },
  OFFICER_ACK: { templateKey: 'offer_letter', usageContext: 'officer_acceptance' },
  EMPLOYMENT_AGREEMENT: { templateKey: 'employment_agreement', usageContext: 'employment_agreement' },
  NDA_PIIA: { templateKey: 'confidentiality_ip', usageContext: 'confidentiality_ip' },
  STOCK_PURCHASE: { templateKey: 'stock_issuance', usageContext: 'stock_issuance' },
  OPTION_GRANT: { templateKey: 'stock_issuance', usageContext: 'stock_option_grant' },
  DEFERRED_COMP: { templateKey: 'deferred_comp_addendum', usageContext: 'deferred_comp_addendum' },
};

const hasRole = (p: Person, r: Role) => p.roles.includes(r);
const findAll = (people: Person[], role: Role) => people.filter(p => hasRole(p, role));
const firstOrThrow = (arr: Person[], label: string) => {
  if (!arr.length) throw new Error(`Missing ${label}`);
  return arr[0];
};

export function buildExecutiveFlow(company: Company, people: Person[]): FlowOutput {
  const incorporator = firstOrThrow(findAll(people, 'INCORPORATOR'), 'Incorporator');
  const board = findAll(people, 'BOARD');
  const officers = people.filter(p => p.roles.some(r => ['CEO','CFO','CXO','COO','CTO','OFFICER'].includes(r)));
  const equityHolders = people.filter(p => p.equity && (p.equity.sharesGranted > 0));

  // Packet 1: Pre-Incorporation
  const packet1: Packet = {
    packetId: 'P1_PREINC',
    title: 'Pre-Incorporation Setup',
    order: 1,
    documents: [
      {
        templateId: 'INCORPORATOR_CONSENT',
        templateKey: TEMPLATE_MAPPINGS.INCORPORATOR_CONSENT.templateKey,
        title: 'Pre-Incorporation Consent of Incorporators',
        signers: [
          { personId: incorporator.id, roleHint: 'INCORPORATOR', actsAs: 'Individual', required: true, order: 1 },
        ],
        dataBindings: { company, incorporator, boardNames: board.map(b => b.fullName) },
      },
      {
        templateId: 'INCORPORATOR_STATEMENT',
        templateKey: TEMPLATE_MAPPINGS.INCORPORATOR_STATEMENT.templateKey,
        title: 'Incorporator Statement',
        blockingIds: ['INCORPORATOR_CONSENT'],
        signers: [
          { personId: incorporator.id, roleHint: 'INCORPORATOR', actsAs: 'Individual', required: true, order: 1 },
        ],
        dataBindings: { company, incorporator, boardMembers: board.map(b => ({ name: b.fullName, email: b.email, address: company.principalOfficeAddress })) },
      },
    ],
  };

  // Packet 2: Initial Board Actions
  const packet2: Packet = {
    packetId: 'P2_BOARD',
    title: 'Appointment & Authority',
    order: 2,
    documents: [
      {
        templateId: 'BOARD_APPOINT_OFFICERS',
        templateKey: TEMPLATE_MAPPINGS.BOARD_APPOINT_OFFICERS.templateKey,
        title: 'Board Consent to Appointment of Officers',
        blockingIds: ['INCORPORATOR_STATEMENT'],
        signers: board.map<SignatureSlot>((b, i) => ({
          personId: b.id,
          roleHint: 'BOARD',
          actsAs: 'Company',
          required: true,
          order: i + 1,
        })),
        carbonCopyPersonIds: officers.map(o => o.id),
        dataBindings: {
          company,
          officers: officers.map(o => ({
            name: o.fullName,
            roles: o.roles.filter(r => ['CEO','CFO','CXO','COO','CTO','OFFICER'].includes(r)),
            salary: o.salary,
            title: o.roles.includes('CEO') ? 'Chief Executive Officer'
                  : o.roles.includes('CFO') ? 'Chief Financial Officer'
                  : o.roles.includes('CXO') ? 'Chief Experience Officer'
                  : o.roles.includes('COO') ? 'Chief Operating Officer'
                  : o.roles.includes('CTO') ? 'Chief Technology Officer'
                  : 'Officer',
          })),
          directors: board.map(b => ({ name: b.fullName, email: b.email })),
        },
      },
    ],
  };

  // Packet 3: Officer Acceptances & Core Agreements
  const packet3Docs: RoutedDocument[] = [];
  
  officers.forEach(off => {
    // Officer Acceptance
    packet3Docs.push({
      templateId: `OFFICER_ACK_${off.id}`,
      templateKey: TEMPLATE_MAPPINGS.OFFICER_ACK.templateKey,
      title: `Officer Acceptance Letter – ${off.fullName}`,
      blockingIds: ['BOARD_APPOINT_OFFICERS'],
      signers: [
        { personId: off.id, roleHint: 'OFFICER', actsAs: 'Individual', required: true, order: 1 },
      ],
      dataBindings: { company, officer: off, roles: off.roles },
    });

    // NDA/PIIA
    packet3Docs.push({
      templateId: `NDA_PIIA_${off.id}`,
      templateKey: TEMPLATE_MAPPINGS.NDA_PIIA.templateKey,
      title: `Confidentiality & IP Assignment – ${off.fullName}`,
      blockingIds: ['BOARD_APPOINT_OFFICERS'],
      signers: [
        { personId: off.id, roleHint: 'OFFICER', actsAs: 'Individual', required: true, order: 1 },
        { personId: board[0]?.id, roleHint: 'BOARD', actsAs: 'Company', required: true, order: 2 },
      ],
      dataBindings: { company, recipient: off },
    });

    // Employment Agreement
    packet3Docs.push({
      templateId: `EMPLOYMENT_AGREEMENT_${off.id}`,
      templateKey: TEMPLATE_MAPPINGS.EMPLOYMENT_AGREEMENT.templateKey,
      title: `Executive Employment Agreement – ${off.fullName}`,
      blockingIds: [`NDA_PIIA_${off.id}`],
      signers: [
        { personId: off.id, roleHint: 'OFFICER', actsAs: 'Individual', required: true, order: 1 },
        { personId: board[0]?.id, roleHint: 'BOARD', actsAs: 'Company', required: true, order: 2 },
      ],
      dataBindings: {
        company,
        executive: off,
        title: off.roles.includes('CEO') ? 'Chief Executive Officer'
              : off.roles.includes('CFO') ? 'Chief Financial Officer'
              : off.roles.includes('CXO') ? 'Chief Experience Officer'
              : off.roles.includes('COO') ? 'Chief Operating Officer'
              : off.roles.includes('CTO') ? 'Chief Technology Officer'
              : 'Officer',
        salary: off.salary,
      },
    });
  });

  const packet3: Packet = {
    packetId: 'P3_OFFICER_CORE',
    title: 'Employment & Compensation',
    order: 3,
    documents: packet3Docs,
  };

  // Packet 4: Equity (only equity holders)
  const packet4Docs: RoutedDocument[] = [];
  
  equityHolders.forEach(holder => {
    const baseBindings = {
      company,
      holder,
      vesting: holder.equity?.vesting,
      consideration: holder.equity?.consideration,
    };

    if (holder.equity!.sharesGranted > 0 && holder.equity!.strikePriceUSD === undefined) {
      // Stock Purchase
      packet4Docs.push({
        templateId: `STOCK_PURCHASE_${holder.id}`,
        templateKey: TEMPLATE_MAPPINGS.STOCK_PURCHASE.templateKey,
        title: `Equity / Share Grant Agreement – ${holder.fullName}`,
        blockingIds: [],
        signers: [
          { personId: holder.id, roleHint: 'SHAREHOLDER', actsAs: 'Individual', required: true, order: 1 },
          { personId: board[0]?.id, roleHint: 'BOARD', actsAs: 'Company', required: true, order: 2 },
        ],
        dataBindings: baseBindings,
      });
    }

    if (holder.equity!.strikePriceUSD !== undefined) {
      // Option Grant
      packet4Docs.push({
        templateId: `OPTION_GRANT_${holder.id}`,
        templateKey: TEMPLATE_MAPPINGS.OPTION_GRANT.templateKey,
        title: `Stock Option Grant – ${holder.fullName}`,
        blockingIds: [],
        signers: [
          { personId: holder.id, roleHint: 'OFFICER', actsAs: 'Individual', required: true, order: 1 },
          { personId: board[0]?.id, roleHint: 'BOARD', actsAs: 'Company', required: true, order: 2 },
        ],
        dataBindings: { ...baseBindings, strikePriceUSD: holder.equity!.strikePriceUSD },
      });
    }
  });

  // Deferred Compensation (for officers with deferred salary)
  officers.forEach(off => {
    if (off.salary?.isDeferred) {
      packet4Docs.push({
        templateId: `DEFERRED_COMP_${off.id}`,
        templateKey: TEMPLATE_MAPPINGS.DEFERRED_COMP.templateKey,
        title: `Deferred Compensation & Vesting Schedule – ${off.fullName}`,
        blockingIds: [`EMPLOYMENT_AGREEMENT_${off.id}`],
        signers: [
          { personId: off.id, roleHint: 'OFFICER', actsAs: 'Individual', required: true, order: 1 },
          { personId: board[0]?.id, roleHint: 'BOARD', actsAs: 'Company', required: true, order: 2 },
        ],
        dataBindings: { company, executive: off, salary: off.salary, equity: off.equity },
      });
    }
  });

  const packet4: Packet = {
    packetId: 'P4_EQUITY',
    title: 'Equity & Compensation',
    order: 4,
    documents: packet4Docs,
  };

  const packets = [packet1, packet2, packet3, packet4].filter(p => p.documents.length > 0);
  return { packets };
}

