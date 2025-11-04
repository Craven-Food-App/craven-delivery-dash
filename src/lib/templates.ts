// Document templates configuration
export type TemplateMeta = {
  id: string;
  title: string;
  placeholders: string[];
};

export const templates: TemplateMeta[] = [
  { 
    id: "employment_agreement", 
    title: "Executive Employment Agreement", 
    placeholders: ["company_name", "full_name", "role", "equity_percentage", "effective_date", "funding_trigger", "governing_law"]
  },
  { 
    id: "board_resolution", 
    title: "Board Resolution – Appointment of Officers", 
    placeholders: ["company_name", "date", "directors", "ceo_name", "cfo_name", "cxo_name", "equity_ceo", "equity_cfo", "equity_cxo", "funding_trigger"]
  },
  { 
    id: "founders_agreement", 
    title: "Founders' / Shareholders' Agreement", 
    placeholders: ["company_name", "founders_table_html", "vesting_years", "cliff_months", "governing_law"]
  },
  { 
    id: "stock_issuance", 
    title: "Stock Subscription / Issuance Agreement", 
    placeholders: ["company_name", "full_name", "role", "share_count", "class_name", "par_value", "consideration", "vesting_schedule"]
  },
  { 
    id: "confidentiality_ip", 
    title: "Confidentiality & IP Assignment Agreement", 
    placeholders: ["company_name", "full_name", "role", "effective_date", "governing_law"]
  },
  { 
    id: "deferred_comp_addendum", 
    title: "Deferred Compensation Addendum", 
    placeholders: ["company_name", "full_name", "role", "funding_trigger", "effective_date", "governing_law"]
  },
  { 
    id: "offer_letter", 
    title: "Executive Offer Letter", 
    placeholders: ["company_name", "full_name", "role", "equity_percentage", "effective_date", "funding_trigger"]
  },
  { 
    id: "bylaws_officers_excerpt", 
    title: "Bylaws – Officers (Excerpt)", 
    placeholders: ["company_name", "funding_trigger", "officer_roles_html", "governing_law"]
  },
  { 
    id: "irs_83b", 
    title: "IRS Form 83(b) – Info Sheet", 
    placeholders: ["taxpayer_name", "taxpayer_address", "company_name", "date_of_transfer", "stock_class", "number_of_shares", "fair_market_value", "amount_paid"]
  }
];

// Template HTML generators
export function renderHtml(templateId: string, data: Record<string, any>): string {
  const template = templates.find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const styles = `
    <style>
      body { 
        font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #111827; 
        padding: 48px; 
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 { color: #ff7a45; margin: 0 0 8px; font-size: 24px; }
      h2 { margin: 24px 0 12px; font-size: 20px; }
      h3 { margin: 16px 0 8px; font-size: 16px; }
      .muted { color: #6b7280; font-size: 14px; }
      .sig-block { margin-top: 60px; display: flex; gap: 48px; flex-wrap: wrap; }
      .sig { width: 280px; border-top: 1px solid #000; padding-top: 8px; }
      .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .section { margin: 24px 0; }
      p { margin: 12px 0; }
      ul, ol { margin: 12px 0; padding-left: 24px; }
      li { margin: 6px 0; }
    </style>
  `;

  let body = "";

  // Generate HTML based on template type
  switch (templateId) {
    case "employment_agreement":
      body = `
        <h1>Executive Employment Agreement</h1>
        <div class="muted">Between ${data.company_name || "Company"} and ${data.full_name || "Executive"}</div>
        
        <div class="section">
          <p><strong>Effective Date:</strong> ${data.effective_date || "TBD"}</p>
          <p><strong>Position:</strong> ${data.role || "Executive"}</p>
          <p><strong>Equity:</strong> ${data.equity_percentage || "0"}%</p>
        </div>

        <div class="section">
          <h2>1. Employment Terms</h2>
          <p>${data.company_name || "The Company"} hereby employs ${data.full_name || "Executive"} as ${data.role || "an executive officer"}, and ${data.full_name || "Executive"} accepts such employment, subject to the terms and conditions set forth in this Agreement.</p>
        </div>

        <div class="section">
          <h2>2. Compensation</h2>
          <p>The Executive shall receive equity compensation of ${data.equity_percentage || "0"}% of the company, subject to vesting schedules and funding triggers as described in separate documentation.</p>
          <p><strong>Funding Trigger:</strong> ${data.funding_trigger || "Upon Series A funding or significant investment event"}</p>
        </div>

        <div class="section">
          <h2>3. Governing Law</h2>
          <p>This Agreement shall be governed by the laws of ${data.governing_law || "the State of Delaware"}.</p>
        </div>

        <div class="sig-block">
          <div class="sig">
            ${data.signature_company_html || ""}
            <div class="label">Company Representative</div>
            <div class="label">${data.company_name || "Company Name"}</div>
          </div>
          <div class="sig">
            ${data.signature_executive_html || ""}
            <div class="label">${data.full_name || "Executive Name"}</div>
            <div class="label">${data.role || "Title"}</div>
          </div>
        </div>
      `;
      break;

    case "offer_letter":
      body = `
        <h1>Executive Offer Letter</h1>
        <p class="muted">${data.effective_date || "Date"}</p>

        <div class="section">
          <p>Dear ${data.full_name || "Candidate"},</p>
          <p>We are pleased to offer you the position of <strong>${data.role || "Executive"}</strong> at ${data.company_name || "Crave'n, Inc."}</p>
        </div>

        <div class="section">
          <h2>Position Details</h2>
          <ul>
            <li><strong>Title:</strong> ${data.role || "Executive"}</li>
            <li><strong>Equity:</strong> ${data.equity_percentage || "0"}%</li>
            <li><strong>Start Date:</strong> ${data.effective_date || "TBD"}</li>
          </ul>
        </div>

        <div class="section">
          <h2>Compensation Structure</h2>
          <p>You will receive ${data.equity_percentage || "0"}% equity in the company. Additional compensation details will be formalized upon ${data.funding_trigger || "Series A funding"}.</p>
        </div>

        <div class="section">
          <p>We look forward to having you join our team!</p>
          <p>Sincerely,<br/>${data.company_name || "Crave'n, Inc."}</p>
        </div>
      `;
      break;

    default:
      body = `
        <h1>${template.title}</h1>
        <div class="section">
          <p><strong>Company:</strong> ${data.company_name || "Crave'n, Inc."}</p>
          ${data.full_name ? `<p><strong>Name:</strong> ${data.full_name}</p>` : ""}
          ${data.role ? `<p><strong>Role:</strong> ${data.role}</p>` : ""}
        </div>
        <div class="section">
          <p>This document contains the terms and conditions for ${template.title.toLowerCase()}.</p>
        </div>
      `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${template.title}</title>
  ${styles}
</head>
<body>
  ${body}
</body>
</html>`;
}
