# ZK-Firmation

An advanced legal verification system using Zero Knowledge Proofs (ZKP) and Mina Protocol.

## Overview

ZK-Firmation cryptographically verifies information in legal documents without revealing sensitive data. The system combines:

- **OCR Extraction** to read text from documents
- **Intelligent NLP** to extract specific information
- **Zero Knowledge Proofs (ZKP)** to cryptographically verify without revealing data
- **Revocation System** based on MerkleMap to invalidate documents
- **Verification History** to track all performed verifications

## Features

- **Universal Document Compatibility**: Process attestations, certificates, contracts, invoices, etc.
- **Advanced Zero Knowledge Proofs**: Age verification without revealing birth dates, date verification, value verification, etc.
- **Query-Based System**: Accept any document and any query
- **Verifiable Certificates**: Generate verification certificates with proofs recorded on the blockchain
- **MerkleMap for Revocation**: Enable document or information revocation
- **Verification History**: Track the history of all verifications performed

## Available ZKP Proofs

The system can generate several types of ZKP proofs:

1. **Document Validity Proofs**: Verify that a document is valid, signed and not revoked
2. **Date Proofs**: Verify a date in a document (expiration, signature, etc.)
3. **Age Proofs**: Verify that a person is of legal age or within an age range without revealing their date of birth
4. **Value Proofs**: Verify that a specific value is present in a document

## Technical Highlights

- **Advanced Age Verification**: Prove age is between specified bounds without revealing exact birth date
- **Date Arithmetics**: Perform arithmetic operations on dates to prove temporal relationships
- **Revocation System**: Using MerkleMap for efficient cryptographic revocation
- **Verification History**: Store verification history in a verifiable data structure
- **NLP Extraction**: Extract information from documents using regex patterns and AI assistance

## Installation

```bash
# Clone the repository
git clone https://github.com/phamphamh/zk_firmation.git
cd zk_firmation

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

## Configuration

```
# .env file
MISTRAL_API_KEY=your-api-key  # Optional, for AI-powered extraction
```

## Usage

### Universal Verification

```bash
# Verify information in a document
npm run zkp:universel <document_path> "<query>"

# Examples:
npm run zkp:universel document.pdf "birth date"
npm run zkp:universel attestation.pdf "Is the document valid?"
npm run zkp:universel certificate.pdf "Is the person of legal age?"
npm run zkp:universel contract.pdf "What is the expiration date?"
```

### Sample Queries:

- "What is the birth date?"
- "Is the document valid and signed?"
- "Is the person of legal age?"
- "What is the signer's address?"
- "What is the expiration date?"
- "Was the contract signed after 01/01/2022?"
- "Is the holder's age between 18 and 25 years?"

## Project Structure

- `scripts/utils/document-extractor.js`: OCR extraction module with Tesseract
- `scripts/utils/info-extractor.js`: Information extraction module with NLP
- `scripts/utils/zkp-generic.js`: Generic ZKP module for all types of proofs
- `scripts/zkp-universelle.js`: Main script that integrates all components
- `scripts/zkp-test.js`: Simplified test script for quick testing

## Advanced Usage Examples

### Revocation System

```javascript
// Revoke a document
const zkpManager = new ZkpManager();
const documentHash = Field("123456789");
zkpManager.revocationSystem.revoke(documentHash);

// Check if a document is revoked
const isRevoked = zkpManager.revocationSystem.isRevoked(documentHash);
```

### Verification History

```javascript
// Get verification history for a document
const zkpManager = new ZkpManager();
const documentHash = Field("123456789");
const history = zkpManager.verificationHistory.getForDocument(documentHash);
```

### Age Range Proofs

```javascript
// Prove a person is between 18 and 25 years old without revealing their birth date
const zkpManager = new ZkpManager();
const dobStr = "01/01/2000";
const proofResult = await zkpManager.proveAgeRange(dobStr, 18, 25, documentInfo, "Verify eligibility");
```

## Technologies Used

- **o1js**: ZKP library for Mina Protocol
- **Tesseract.js**: OCR for text extraction
- **pdf-parse**: PDF text extraction
- **MerkleMap**: Data structure for efficient revocation
- **Mistral AI API** (optional): For more accurate information extraction

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT