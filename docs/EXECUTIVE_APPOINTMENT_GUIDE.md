# Executive Appointment Guide
## Step-by-Step Instructions for Appointing Executives in the Company Portal

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Accessing the Governance Admin Dashboard](#part-1-accessing-the-governance-admin-dashboard)
3. [Part 2: Creating a New Executive Appointment](#part-2-creating-a-new-executive-appointment)
4. [Part 3: Automatic Workflow](#part-3-automatic-workflow-happens-automatically)
5. [Part 4: Board Voting Process](#part-4-board-voting-process)
6. [Part 5: Executive Signing Process](#part-5-executive-signing-process)
7. [Part 6: Completion and Activation](#part-6-completion-and-activation)
8. [Part 7: Troubleshooting](#part-7-troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Prerequisites

Before starting, ensure you have:
- ✅ Access to the Company Portal
- ✅ Corporate Secretary or Governance Admin role
- ✅ Board of Directors initialized

---

## Part 1: Accessing the Governance Admin Dashboard

### Step 1: Navigate to Company Portal

1. Log in to the application
2. Navigate to the **Company Portal** (usually via navigation menu or direct URL)
3. URL pattern: `/company/governance-admin` or similar

### Step 2: Open Governance Administration

1. In the Company Portal, locate the **"Governance Administration"** section
2. Click on the **Governance Admin Dashboard**
3. You should see tabs: **Appointments**, **Resolutions**, **Officers**, etc.

---

## Part 2: Creating a New Executive Appointment

### Step 3: Start New Appointment

1. In the Governance Admin Dashboard, click the **"Appointments"** tab
2. Click the **"New Appointment"** button (top right, plus icon)
3. You'll be taken to the **New Executive Appointment** form

### Step 4: Fill in Basic Information

**Required Fields:**

- **Officer Name**: Full legal name (e.g., "John Doe")
- **Email**: Corporate email address (e.g., "john.doe@cravenusa.com")
- **Phone Number**: Contact number (optional)
- **Title**: Select from dropdown:
  - Chief Executive Officer (CEO)
  - Chief Financial Officer (CFO)
  - Chief Technology Officer (CTO)
  - Chief Operating Officer (COO)
  - Chief Experience Officer (CXO)
  - Chief Marketing Officer (CMO)
  - Chief Human Resources Officer (CHRO)
  - Chief Compliance Officer (CCO)
  - Chief Legal Officer (CLO)
  - President
  - Vice President
- **Department**: (optional, e.g., "Engineering", "Sales", "Operations")
- **Appointment Type**: Select:
  - New Appointment
  - Replacement
  - Interim

### Step 5: Formation Mode (If Applicable)

- **Check "Formation Mode"** if:
  - Articles of Incorporation are not yet filed
  - This is a pre-incorporation appointment
- This will generate a **Pre-Incorporation Consent** document
- If Articles are on file, leave unchecked

### Step 6: Dates and Terms

- **Board Meeting Date**: Date of the board meeting (optional)
- **Effective Date**: When the appointment takes effect (required)
- **Term Length (Months)**: Duration of appointment (e.g., 36, 48) (optional)
- **Reporting To**: Who they report to (e.g., "Board of Directors", "CEO")

### Step 7: Authority and Responsibilities

- **Authority Granted**: Describe the authority and responsibilities
  - Example: "Full authority to manage engineering operations, hire/fire team members, approve technical budgets up to $500K"

### Step 8: Compensation Structure

- **Base Salary (Annual)**: Enter annual base salary (required)
- **Annual Bonus Percentage**: Enter percentage (e.g., 20)
- **Performance Bonus Structure**: Describe performance bonus criteria
- **Benefits Package**: List benefits (health insurance, retirement, PTO, etc.)

### Step 9: Equity (If Applicable)

- **Check "Equity Included"** if equity is part of compensation
- If checked, fill in:
  - **Equity Percentage**: Percentage of company (e.g., 5.0)
  - **Share Count**: Number of shares (e.g., 10,000)
  - **Vesting Schedule**: Description (e.g., "4-year vesting, 25% after 1 year, monthly thereafter")
  - **Exercise Price**: If applicable (e.g., "$0.01 per share")

### Step 10: Additional Notes

- **Notes**: Any additional information about the appointment

### Step 11: Submit Appointment

1. Review all information carefully
2. Click **"Create Appointment Draft"**
3. You'll see: "Appointment draft created successfully. Documents are being generated..."
4. You'll be redirected to the Appointments list

---

## Part 3: Automatic Workflow (Happens Automatically)

### Step 12: Document Generation

The system automatically:

1. ✅ Creates user account for appointee (if email provided)
2. ✅ Creates appointment record in both `executive_appointments` and `appointments` tables
3. ✅ Generates documents:
   - Pre-Incorporation Consent (if Formation Mode checked)
   - Appointment Letter
   - Board Resolution (Officer Appointment Resolution)
   - CEO Appointment Resolution (if CEO)
   - Officer Acceptance
4. ✅ Creates Board Resolution in `governance_board_resolutions` (status: PENDING_VOTE)
5. ✅ Creates onboarding record in `executive_onboarding`
6. ✅ Sends email notification to appointee with documents

### Step 13: Verify Documents Generated

1. In the **Appointments** list, find your new appointment
2. Check the **"Documents"** column — should show "X / 7 Generated" or "X / 8 Generated" (if Formation Mode)
3. If documents are missing, click the refresh icon to regenerate

---

## Part 4: Board Voting Process

### Step 14: Access Voting Dashboard

1. In Governance Admin Dashboard, click the **"Voting Dashboard"** tab
2. Find the resolution for your appointment
3. Status should be **"PENDING_VOTE"**

### Step 15: Board Members Vote

1. Each board member:
   - Opens the **Voting Dashboard**
   - Finds the resolution
   - Clicks **"Vote"**
   - Selects: **Yes**, **No**, or **Abstain**
   - Adds optional comment
   - Submits vote
2. Votes are tracked in real-time
3. Progress bar shows: "X / Y voted"

### Step 16: Resolution Finalization

- **When majority votes YES:**
  - Resolution status → **ADOPTED**
  - System automatically executes the resolution
  - Onboarding status → **documents_sent**
  - Executive receives email with signing instructions
- **If majority votes NO:**
  - Resolution status → **REJECTED**
  - Appointment stops

---

## Part 5: Executive Signing Process

### Step 17: Executive Receives Email

The appointee receives an email with:
- Link to Executive Signing Portal
- List of documents to sign
- Signing instructions (README attached)

### Step 18: Executive Signs Documents

1. Executive clicks link in email
2. Logs in (or creates account if new)
3. Navigates to **"Onboarding Packet"** tab in Executive Dashboard
4. Sees progress: "X of Y documents signed"
5. For each document:
   - Click **"Sign"**
   - Review document carefully
   - Create signature (draw, type, or upload)
   - Apply signature to all required fields
   - Save
6. Repeat for all documents

### Step 19: Monitor Signing Progress

1. In Governance Admin Dashboard → **Appointments** tab
2. View appointment status
3. Status changes:
   - "Awaiting Signatures" → "Signing In Progress" → "Ready for Review"

---

## Part 6: Completion and Activation

### Step 20: Automatic Completion

When all documents are signed:

1. ✅ System detects completion
2. ✅ Appointment status → **"ACTIVE"**
3. ✅ Officer added to `corporate_officers` table
4. ✅ Permissions/roles assigned automatically
5. ✅ If equity included:
   - Equity grant created
   - Vesting schedule established
   - Shares issued
   - Share certificate generated
6. ✅ All actions logged to `governance_log`

### Step 21: Verify Completion

1. Go to **"Officers"** tab in Governance Admin Dashboard
2. Confirm new officer appears in the list
3. Status should be **"ACTIVE"**
4. Check **"Equity Dashboard"** (if equity granted) to see:
   - Equity grant details
   - Vesting schedule
   - Share certificate

---

## Part 7: Troubleshooting

### Documents Not Generating?

1. Check appointment status in Appointments list
2. Click the refresh icon next to the appointment
3. Check browser console for errors
4. Verify templates exist in `document_templates` table

### Resolution Not Created?

1. Check Governance Admin Dashboard → **Resolutions** tab
2. Verify appointment has `appointee_user_id` set
3. Check edge function logs for errors

### Email Not Sent?

1. Verify appointee email is correct
2. Check `send-appointment-documents-email` function logs
3. Verify email template exists

### Voting Not Working?

1. Verify board members exist in `board_members` table
2. Check user has board member role
3. Verify resolution status is "PENDING_VOTE"

### Signing Not Completing?

1. Check all required signature fields are filled
2. Verify documents in `board_documents` have `signing_status = 'completed'`
3. Check `executive_onboarding` status

---

## Quick Reference

### Status Flow

```
DRAFT → SENT_TO_BOARD → BOARD_ADOPTED → AWAITING_SIGNATURES → 
READY_FOR_SECRETARY_REVIEW → SECRETARY_APPROVED → ACTIVATING → ACTIVE
```

### Complete Workflow Sequence

1. Corporate Secretary creates appointment → `governance-create-appointment`
2. Creates user (if needed) and appointment records
3. Triggers `governance-handle-appointment-workflow`
4. Generates documents:
   - Pre-Incorporation Consent (if formation_mode)
   - Appointment Letter
   - Board Resolution
   - CEO Resolution (if CEO)
   - Officer Acceptance
5. Creates resolution → `governance_board_resolutions` (status: PENDING_VOTE)
6. Creates onboarding record → `executive_onboarding`
7. Sends email → `send-appointment-documents-email`
8. Board votes → `governance-cast-vote`
9. Resolution finalized → `governance-finalize-resolution`
10. Resolution executed → `governance-execute-resolution`
11. Executive signs documents
12. Appointment completed → `governance-complete-appointment`
13. Officer added to `corporate_officers`
14. Permissions assigned
15. If equity: shares granted and certificate generated

### Required Documents Checklist

- [ ] Pre-Incorporation Consent (if Formation Mode)
- [ ] Appointment Letter
- [ ] Board Resolution (Officer Appointment)
- [ ] CEO Appointment Resolution (if CEO)
- [ ] Officer Acceptance
- [ ] Employment Agreement (if applicable)
- [ ] Confidentiality & IP Assignment (if applicable)
- [ ] Stock Subscription Agreement (if equity)

### Key URLs/Navigation

- **Company Portal**: `/company/governance-admin`
- **New Appointment**: `/company/governance-admin/appointments/new`
- **Appointments List**: `/company/governance-admin/appointments`
- **Voting Dashboard**: `/company/governance-admin` → "Voting Dashboard" tab
- **Resolutions**: `/company/governance-admin` → "Resolutions" tab
- **Officers**: `/company/governance-admin` → "Officers" tab

---

## Best Practices

1. ✅ **Double-check email addresses** before submitting
2. ✅ **Use Formation Mode** only if Articles of Incorporation are not filed
3. ✅ **Include detailed authority descriptions** for clarity
4. ✅ **Monitor the Appointments list** for status updates
5. ✅ **Use "Regenerate Documents"** button if documents are missing
6. ✅ **Check Governance Logs** for detailed action history

---

## Support

- **Email**: executive@cravenusa.com
- **Check Governance Logs** tab for detailed action history
- **Review `governance_log` table** for troubleshooting

---

## Notes

- This workflow is fully automated — documents are generated automatically
- All actions are logged to `governance_log` for audit purposes
- The system handles user creation, document generation, and email notifications
- Board voting is tracked in real-time
- Executive signing progress is monitored automatically

---

**Document Version**: 1.0  
**Last Updated**: February 2025  
**System**: Crave'n Governance Platform

