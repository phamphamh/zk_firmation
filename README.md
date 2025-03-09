# ZK-Firmation

A secure document verification system using Zero Knowledge Proofs (ZKP) to validate document information without exposing sensitive data.

## Overview

ZK-Firmation allows users to:
1. Submit a document for verification
2. Extract key information through OCR
3. Verify claims about the document without revealing the entire content
4. Generate a cryptographic certificate attesting to the verification

## Project Structure

The application is organized into several key components:

### Document Processing
- `src/services/document-service.ts`: Extracts text from documents (PDF, images, text files)

### Client-Side Services
- `src/services/document-service.ts`: Client-side service for document handling
- `src/services/api-service.ts`: Main service for document verification flow
- `src/services/mock-document-service.ts`: Mock data service for testing

### API Routes
- `src/pages/api/extract-text.ts`: API endpoint for text extraction
- `src/pages/api/extract-info.ts`: API endpoint for specific information extraction

### UI Pages
- `src/pages/index.tsx`: Landing page
- `src/pages/verify.tsx`: Main verification page
- `src/pages/mock-verify.tsx`: Test page with mock documents

## Verification Process

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │     │    Text     │     │  Extract    │     │   Verify    │
│  Document   │────►│ Extraction  │────►│ Information │────►│  & Generate │
│             │     │   (OCR)     │     │             │     │ Certificate │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Document Upload**
   - User uploads a document and specifies a claim to verify
   - Document is sent to the server for processing

2. **Text Extraction**
   - Server extracts text from the document using OCR
   - For PDFs, they are converted to images first then processed
   - Fallback mechanisms handle different document types

3. **Information Extraction**
   - Specific information is extracted based on the user's query
   - Uses regex patterns or AI (via Mistral API) to extract relevant details

4. **Verification & Certification**
   - The extracted information is verified against the user's claim
   - A certificate is generated with the verification result
   - Optionally, a Zero Knowledge Proof can be generated to prove the verification without revealing document contents

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to see the application

## Testing

The application includes a mock verification page at `/mock-verify` that allows testing the verification process with pre-loaded documents:
- Invoice (payment verification)
- Rental contract (contract validity)
- ID card (identity verification)

## Technologies

- Next.js
- TypeScript
- Tesseract.js (OCR)
- Mistral AI (information extraction)
- Mina Protocol (Zero Knowledge Proofs)
- TailwindCSS (UI)