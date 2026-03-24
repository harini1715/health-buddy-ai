

## Problem

The `analyze-prescription` edge function returns HTTP 402 when AI credits are exhausted. The client treats this as a generic error, showing a confusing runtime error and blank screen instead of a helpful message.

## Plan

### Step 1: Improve error handling in UploadPrescription.tsx

Update the `handleFile` function to detect 402 and 429 status codes from the edge function response and show a clear, styled billing/rate-limit message instead of a generic error.

- Parse the error response from `supabase.functions.invoke` — check `fnError.status` or the response data for the specific error string
- Display a distinct UI card with a warning icon explaining that AI credits are depleted and linking to Settings > Workspace > Usage
- Prevent the blank screen by ensuring the error state always renders properly

### Step 2: Add manual prescription entry fallback

When AI analysis fails (any error, not just 402), show a manual entry form below the error card so the user can still input prescription details:

- Form fields: Doctor Name, Hospital Name, Date, Summary (optional)
- Dynamic medicine rows: Medicine Name, Dosage, Timing (dropdown), Food Instruction (dropdown)
- "Add Medicine" button to add more rows
- "Save Prescription" button that writes to the same `prescriptions` + `medicines` tables
- Reuse existing save logic from the AI results flow

### Step 3: Add translation keys

Add manual entry form labels to all 4 languages (en, ta, hi, te) in `useLanguage.tsx`:
- `upload.manualEntry`, `upload.manualSubtitle`, `upload.addMedicine`, `upload.removeMedicine`, `upload.creditError`, `upload.rateLimitError`

### Technical Details

**File changes:**
1. `src/pages/UploadPrescription.tsx` — Add 402/429 detection, billing message card, and manual entry form component
2. `src/hooks/useLanguage.tsx` — Add ~10 new translation keys across all 4 languages

**No database or edge function changes needed** — the manual form saves to the same tables using the same insert logic.

