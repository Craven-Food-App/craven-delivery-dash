# Executive Activation Workflow System

## Overview

This document describes the Fortune-500-style post-signature executive activation workflow for Crave'n USA, Inc. This system automatically processes executive appointments from document signing through full activation, including corporate records, role assignment, equity activation, and compliance tracking.

## Workflow States

The `executive_appointments` table uses the following status workflow:

1. **DRAFT** - Initial appointment creation
2. **SENT_TO_BOARD** - Sent to board for approval
3. **BOARD_ADOPTED** - Board has adopted the resolution
4. **AWAITING_SIGNATURES** - Waiting for executive to sign documents
5. **READY_FOR_SECRETARY_REVIEW** - All documents signed, ready for Corporate Secretary validation
6. **SECRETARY_APPROVED** - Corporate Secretary has validated and approved
7. **ACTIVATING** - Activation workflow in progress
8. **ACTIVE** - Officer fully activated and operational

## Database Schema

### New Tables Created

1. **officer_ledger** - Official ledger tracking all corporate officers
2. **executive_compensation** - Compensation records with deferred activation triggers
3. **executive_banking_authority** - Banking signatory permissions
4. **executive_compliance_records** - Compliance tracking (NDA, conflict forms, etc.)
5. **cap_table_entries** - Equity grants and cap table entries
6. **officer_activation_timeline** - Timeline of activation events

### Extended Tables

- **executive_appointments** - Added `activation_date`, `secretary_approved_at`, `secretary_approved_by`
- **executive_documents** - Added `signed_at`, `signed_by_user`, `verification_status`

## Automatic Triggers

### Document Signing Detection

When an executive signs a document, a trigger (`trigger_document_signed`) checks if all required documents are signed. If so, it automatically:
- Updates appointment status to `READY_FOR_SECRETARY_REVIEW`
- Logs a timeline event
- Notifies Corporate Secretary (via notification system)

**Required Documents:**
- Pre-Incorporation Consent (if `formation_mode = true`)
- Appointment Letter
- Board Resolution
- Stock Certificate
- Confidentiality & IP Agreement
- Bylaws Acknowledgment
- Conflict of Interest Disclosure

## Corporate Secretary Validation

**Location:** Company Portal → Governance Admin → Officer Validation

The Corporate Secretary can:
1. View all appointments with status `READY_FOR_SECRETARY_REVIEW`
2. Review all signed documents
3. Complete validation checklist:
   - Identity Verified
   - Background Check Complete
   - Board Approval Confirmed
   - All Documents Complete
4. Add notes
5. Click "Validate & Approve" to trigger activation workflow

## Activation Workflow Steps

When Corporate Secretary approves, the `activate-executive-officer` edge function executes:

### Step 1: Generate Appointment Certificate
- Creates professional HTML certificate
- Uploads to `governance-documents` storage bucket
- Links certificate to officer record

### Step 2: Insert into Officer Ledger
- Creates official ledger entry
- Links to resolution and appointment
- Sets status to `ACTIVE`

### Step 3: Create Corporate Officer Record
- Creates/updates `corporate_officers` record
- Links certificate and resolution
- Sets status to `ACTIVE`

### Step 4: Assign System Roles
- Assigns `CRAVEN_EXECUTIVE` role
- Assigns role-specific role (e.g., `CRAVEN_CEO`, `CRAVEN_CFO`)
- Updates `user_roles` table

### Step 5: Update Leadership Public Page
- **Automatic** - Leadership page queries `corporate_officers` with `status='ACTIVE'`
- No manual action needed
- Officers appear automatically sorted by hierarchy

### Step 6: IT Access Provisioning
- Ensures `exec_users` record exists
- Sets appropriate role and access level
- Grants executive portal access

### Step 7: Equity Activation
- If `equity_included = true`:
  - Parses equity details from appointment
  - Creates `cap_table_entries` record
  - Sets vesting schedule

### Step 8: Compensation Activation
- Parses compensation structure
- Creates `executive_compensation` record
- Sets deferred activation triggers if applicable
- Tracks activation conditions (e.g., `RAISE_500K`, `MRR_100K`)

### Step 9: Banking Authority Preparation
- Creates `executive_banking_authority` record
- Sets permissions based on title:
  - CEO/CFO: Can sign wires, checks, treasury access
  - COO: Can sign checks
- Generates banking authorization packet PDF
- Sets status to `PENDING_BANK_UPLOAD`

### Step 10: Compliance Activation
- Creates `executive_compliance_records` record
- Marks NDA and conflict forms as signed (based on documents)
- Sets identity and background as verified
- Leaves `added_to_do_insurance` as manual toggle

### Step 11: Final Activation
- Updates appointment status to `ACTIVE`
- Sets `activation_date` timestamp
- Logs final timeline event
- Creates governance log entry

## Activation Timeline

Executives can view their activation timeline in:
**Company Portal → Executives → My Appointment**

The timeline shows:
- Document signing completion
- Secretary validation
- Certificate generation
- Ledger updates
- Role assignments
- IT access provisioning
- Equity activation
- Compensation activation
- Banking authorization preparation
- Compliance activation
- Final activation

## Banking Authorization Packet

**Edge Function:** `generate-banking-authorization-packet`

Generates a comprehensive PDF bundle containing:
1. Officer Certificate
2. Appointment Letter
3. Board Resolution
4. Identity Verification Summary
5. Corporate Officer Listing
6. Banking Authority Details
7. Supporting Documents List

**Usage:** Automatically generated during activation workflow, can also be manually triggered.

## Required Document Types

The system tracks these document types in `executive_documents`:

- `pre_incorporation_consent` - Pre-Incorporation Consent (formation only)
- `appointment_letter` - Appointment Letter
- `board_resolution` - Board Resolution Acknowledgment
- `certificate` - Stock Certificate Acceptance
- `confidentiality_ip` - NDA / Confidentiality Agreement
- `bylaws_acknowledgment` - Bylaws Acknowledgment
- `conflict_of_interest` - Conflict of Interest Disclosure

## Role Assignment

When an officer is activated, the following roles are assigned:

**Base Role:**
- `CRAVEN_EXECUTIVE` - All executives get this

**Title-Specific Roles:**
- CEO → `CRAVEN_CEO`
- CFO → `CRAVEN_CFO`
- CTO → `CRAVEN_CTO`
- COO → `CRAVEN_COO`
- Other → `CRAVEN_EXECUTIVE`

## Compensation Deferred Activation

Compensation can be set to activate automatically when certain conditions are met:

- **RAISE_500K** - Activates when company raises $500K
- **MRR_100K** - Activates when MRR reaches $100K
- **MANUAL** - Requires manual activation
- **IMMEDIATE** - Activates immediately upon officer activation

The system tracks `trigger_status`:
- `PENDING` - Waiting for condition
- `MET` - Condition met, ready to activate
- `ACTIVE` - Compensation active

## Compliance Tracking

The `executive_compliance_records` table tracks:

- `nda_signed` - NDA/Confidentiality agreement signed
- `conflict_form_signed` - Conflict of interest form signed
- `identity_verified` - Identity verification complete
- `background_verified` - Background check complete
- `added_to_do_insurance` - Added to D&O insurance (manual toggle)

## Governance Logs

All activation events are logged in `governance_logs`:

- `OFFICER_VALIDATED` - Secretary validation
- `OFFICER_ACTIVATED` - Final activation
- All events include full metadata and timestamps

## Security & Access Control

### RLS Policies

All new tables have Row Level Security (RLS) enabled:

- **Officer Ledger**: Secretary and executives can view, only Secretary can manage
- **Compensation**: Executives can view own, CFO/CEO can manage
- **Banking Authority**: CFO/CEO can view, Secretary/CFO can manage
- **Compliance**: Executives can view own, Secretary can manage
- **Cap Table**: Executives can view own, CFO/CEO can manage
- **Timeline**: All authorized executives can view

### Universal CEO Access

The account `tstroman.ceo@cravenusa.com` has universal access to all tables via the `has_universal_access()` function.

## Edge Functions

### `activate-executive-officer`

**Purpose:** Orchestrates the entire activation workflow

**Input:**
```json
{
  "appointment_id": "uuid"
}
```

**Output:**
```json
{
  "ok": true,
  "message": "Officer activated successfully",
  "activation_date": "2025-02-12T..."
}
```

**Called By:**
- Corporate Secretary validation screen (after approval)

### `generate-banking-authorization-packet`

**Purpose:** Generates banking authorization packet PDF

**Input:**
```json
{
  "appointment_id": "uuid"
}
```

**Output:**
```json
{
  "ok": true,
  "packet_url": "https://...",
  "message": "Banking authorization packet generated successfully"
}
```

**Called By:**
- Automatically during activation workflow
- Can be called manually for regeneration

## Frontend Components

### OfficerValidation.tsx
**Location:** `src/portals/company/governance-admin/OfficerValidation.tsx`

Corporate Secretary validation interface showing:
- List of appointments ready for review
- Document signing status
- Validation checklist
- Notes field
- Approve button

### ActivationTimeline.tsx
**Location:** `src/portals/company/executives/ActivationTimeline.tsx`

Displays activation timeline for executives showing:
- All workflow events
- Event timestamps
- Event descriptions
- Visual timeline with icons

### MyAppointment.tsx (Updated)
**Location:** `src/portals/company/executives/MyAppointment.tsx`

Now includes:
- Activation timeline component
- Appointment details
- Certificate download link

## Testing the Workflow

1. **Create Appointment** → Status: `DRAFT`
2. **Send to Board** → Status: `SENT_TO_BOARD`
3. **Board Adopts** → Status: `BOARD_ADOPTED`
4. **Generate Documents** → Status: `AWAITING_SIGNATURES`
5. **Executive Signs All Documents** → Status: `READY_FOR_SECRETARY_REVIEW` (automatic)
6. **Secretary Validates** → Status: `SECRETARY_APPROVED`
7. **Activation Workflow Runs** → Status: `ACTIVATING` → `ACTIVE`

## Manual Overrides

If needed, appointments can be manually updated:

```sql
UPDATE executive_appointments
SET status = 'ACTIVE',
    activation_date = now()
WHERE id = 'appointment-id';
```

However, this bypasses the activation workflow. Use only for corrections.

## Future Enhancements

Potential additions:
- Email notifications at each workflow stage
- PDF generation for certificates (currently HTML)
- Integration with external HR systems
- Automated background check integration
- D&O insurance API integration
- Compensation trigger monitoring (tracking MRR, fundraising)

## Notes

- **SEC/10-K/8-K requirements removed** as requested (we're not public yet)
- All other Fortune-500-style processes are included
- System is fully automated after Secretary approval
- Timeline provides full audit trail
- All records are immutable (create-only, no deletions)

