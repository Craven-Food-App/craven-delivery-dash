# Driver Signature System - Complete Implementation

## ✅ Current Status

Driver signatures are now being captured and stored, but NOT as a complete signed PDF document.

### What Works Now:
1. ✅ Driver draws signature on canvas
2. ✅ Signature is uploaded to `driver-signatures` storage bucket
3. ✅ Signature metadata is stored in `driver_signatures` table
4. ✅ Driver status is updated to `contract_signed`
5. ✅ Driver is redirected to waitlist/activation

### What's Missing:
❌ **ICA document is NOT being generated as a PDF**
❌ **Signature is NOT being embedded into the ICA document**
❌ **Signed ICA is NOT being stored in the driver's file**

---

## 🎯 Goal: Match Executive Offer Letter Flow

Executive offer letters follow this flow:
1. Generate HTML of offer letter
2. Send email with signature link
3. Executive signs on canvas
4. Signature is embedded into the PDF
5. Signed PDF is stored in `employee_documents` or `craver-documents`
6. Document is viewable in admin portal

### We Need:
1. **Generate ICA PDF** - Use `generate-hr-pdf` function to create ICA PDF
2. **Embed signature** - Add signature image to the PDF at the designated signature line
3. **Store signed PDF** - Save to `craver-documents` or `driver-documents` bucket
4. **Link to driver** - Store in `driver_signatures` table with file URL

---

## 📋 Implementation Plan

### Option 1: Edge Function (Recommended)
Create `generate-signed-ica-pdf` edge function:
1. Takes driver signature image URL
2. Generates ICA HTML (from existing `ICAViewer` component)
3. Embeds signature into HTML
4. Converts HTML to PDF using existing PDF generation logic
5. Uploads to `craver-documents` bucket
6. Returns signed PDF URL

### Option 2: Client-Side PDF Generation
Use `jspdf` and `html2canvas` in `SignAgreement.tsx`:
1. Generate ICA HTML with embedded signature
2. Convert to PDF using `html2canvas` + `jspdf`
3. Upload PDF to storage
4. Update `driver_signatures` with PDF URL

### Option 3: Server-Side Merge
Use PDF library to merge ICA template with signature:
1. Pre-generate ICA PDF template
2. On signature, overlay signature image on PDF
3. Upload final PDF

---

## 🚀 Recommended Approach: Option 1

**Why:**
- Keeps PDF generation server-side (more secure, consistent)
- Reuses existing `generate-hr-pdf` infrastructure
- Can be triggered from any signing flow
- Better error handling

**Steps:**
1. Update `generate-hr-pdf` function to accept `signature_image_url` parameter
2. When present, embed signature into document HTML
3. Upload signed PDF with distinct filename
4. Update `SignAgreement.tsx` to call this function after signature capture

---

## 📁 File Structure

```
supabase/functions/generate-signed-ica-pdf/
├── index.ts                    # New edge function
├── templates/
│   └── ica-template.html      # ICA document HTML

src/components/driver/
├── ICAViewer.tsx               # Existing viewer
├── SignatureCanvas.tsx         # Existing canvas
└── SignedICAViewer.tsx         # New: view signed PDF

src/pages/driverOnboarding/
└── SignAgreement.tsx           # Update to generate PDF
```

---

**Next Step:** Implement `generate-signed-ica-pdf` edge function

