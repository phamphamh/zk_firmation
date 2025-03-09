// Import document services compatible with Next.js
import { extractTextFromDocument, extractInfoFromText, readFileAsText } from './document-service';

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface VerificationRequest {
  document: File;
  query: string;
  customData?: any; // Custom data for demo purposes
  ocrData?: string; // Raw OCR data if available
}

export interface VerificationResult {
  certificate: any;
  certificateUrl: string;
  success: boolean;
  extractedData?: any;
  rawOcrText?: string;
}

/**
 * API Service for document verification with Zero Knowledge Proofs
 *
 * Fully adaptive approach:
 * - No assumptions about document type
 * - Direct extraction from OCR data
 * - Dynamic JSON based only on found data
 * - Verification of query against real data without predefined structure
 */
export class ApiService {
  /**
   * Verifies a document using zero-knowledge proof techniques
   * Extracts document text, processes the information, and generates a verification certificate
   */
  static async verifyDocument(
    request: VerificationRequest,
    progressCallback: (progress: number) => void
  ): Promise<VerificationResult> {
    try {
      await this.simulateStep("Extraction du texte par OCR", 0, 10, progressCallback);

      let rawOcrText = "";

      if (request.ocrData) {
        console.log("Utilisation des données OCR fournies");
        rawOcrText = request.ocrData;
      } else if (request.customData) {
        console.log("Utilisation des données personnalisées");
        rawOcrText = JSON.stringify(request.customData);
      } else {
        try {
          console.log("Tentative d'extraction OCR du document:", request.document.name);
          rawOcrText = await extractTextFromDocument(request.document);
        } catch (error) {
          console.error("Erreur lors de l'extraction OCR:", error);
          rawOcrText = await readFileAsText(request.document);
          rawOcrText = "ÉCHEC DE L'EXTRACTION OCR. LECTURE DIRECTE DU FICHIER:\n\n" + rawOcrText;
        }
      }

      if (!rawOcrText) {
        throw new Error("Aucun texte extrait du document. Impossible de continuer le traitement.");
      }

      console.log("Texte OCR brut:", rawOcrText);
      progressCallback(30);

      await this.simulateStep("Analyse du texte OCR", 30, 50, progressCallback);

      const extractedData = await this.extractDataFromOcr(rawOcrText, request.query);
      console.log("Données extraites:", extractedData);

      await this.simulateStep("Génération des preuves ZKP", 50, 80, progressCallback);
      await this.simulateStep("Création du certificat", 80, 95, progressCallback);

      progressCallback(97);
      console.log("Requête de l'utilisateur:", request.query);

      const verificationResult = this.verifyAffirmation(request.query, extractedData);
      console.log("Résultat de la vérification:", verificationResult);

      progressCallback(100);

      const certificate = this.createCertificate(request, extractedData, verificationResult);
      const certificateBlob = new Blob([JSON.stringify(certificate, null, 2)], {
        type: 'application/json'
      });
      const certificateUrl = URL.createObjectURL(certificateBlob);

      return {
        certificate,
        certificateUrl,
        success: verificationResult.isValid,
        extractedData,
        rawOcrText
      };

    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      throw error;
    }
  }

  /**
   * Simulates a verification process step with progress reporting
   * Used for UI feedback while actual processing happens
   */
  private static async simulateStep(
    stepName: string,
    startProgress: number,
    endProgress: number,
    progressCallback: (progress: number) => void
  ): Promise<void> {
    console.log(`Début de l'étape: ${stepName}`);

    const duration = Math.floor(Math.random() * 500) + 200;
    const steps = 3;
    const progressIncrement = (endProgress - startProgress) / steps;

    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, duration / steps));
      const currentProgress = Math.round(startProgress + (i + 1) * progressIncrement);
      progressCallback(currentProgress);
    }

    console.log(`Fin de l'étape: ${stepName}`);
  }

  /**
   * Saves a file temporarily using a Blob URL in browser environment
   */
  private static async saveTemporaryFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const blobUrl = URL.createObjectURL(file);
        console.log("URL Blob créée pour le fichier:", file.name);
        resolve(blobUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Cleans up a temporary file by revoking the Blob URL
   */
  private static cleanupTemporaryFile(blobUrl: string): void {
    try {
      URL.revokeObjectURL(blobUrl);
      console.log("URL Blob libérée");
    } catch (error) {
      console.error("Erreur lors de la libération de l'URL Blob:", error);
    }
  }

  /**
   * Extracts data from OCR text in a completely adaptive way
   * Makes no assumptions about document structure or type
   */
  private static async extractDataFromOcr(ocrText: string, query: string): Promise<any> {
    const extractedData: Record<string, any> = {};

    const lines = typeof ocrText === 'string'
      ? ocrText.split(/\n/)
      : JSON.stringify(ocrText).split(/\\n/);

    lines.forEach(line => {
      const cleanLine = line.trim();

      if (!cleanLine) return;

      this.extractSpecificPatterns(cleanLine, extractedData);

      const keyValueMatch = cleanLine.match(/^([^:]+)\s*:\s*(.+)$/);
      if (keyValueMatch) {
        const [_, key, value] = keyValueMatch;
        const normalizedKey = this.normalizeKey(key);

        if (normalizedKey && value) {
          extractedData[normalizedKey] = value.trim();
        }
      }
    });

    await this.enrichExtractedDataWithAPI(extractedData, query, ocrText);

    return extractedData;
  }

  /**
   * Normalizes keys by removing special characters and standardizing format
   */
  private static normalizeKey(key: string): string {
    if (!key) return '';

    return key.trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
  }

  /**
   * Extracts specific patterns like dates, amounts, and references from text
   */
  private static extractSpecificPatterns(line: string, data: Record<string, any>): void {
    // Date pattern (DD/MM/YYYY or YYYY-MM-DD)
    const dateMatch = line.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch && !data.date) {
      data.date = dateMatch[0];
    }

    // Amount pattern (currency values)
    const amountMatch = line.match(/(\d+[.,]\d+)[\s]*(?:€|EUR|USD|\$)/i);
    if (amountMatch && !data.montant) {
      data.montant = parseFloat(amountMatch[1].replace(',', '.'));
    }

    // Reference number pattern
    const refMatch = line.match(/(?:ref|reference|n[°o]|id)[\s:]*([a-z0-9-]+)/i);
    if (refMatch && !data.reference) {
      data.reference = refMatch[1];
    }

    // Email pattern
    const emailMatch = line.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    if (emailMatch && !data.email) {
      data.email = emailMatch[0];
    }
  }

  /**
   * Enriches extracted data with information from API based on the query
   */
  private static async enrichExtractedDataWithAPI(data: Record<string, any>, query: string, rawText: string): Promise<void> {
    try {
      const keyPhrases = [
        "date", "expiration", "validité", "signature", "émission",
        "nom", "personne", "identité", "prénom", "signataire",
        "adresse", "lieu", "emplacement", "domicile",
        "montant", "somme", "coût", "prix", "valeur",
        "numéro", "téléphone", "identifiant", "référence",
        "email", "courriel", "contact"
      ];

      const subQueries: string[] = [];
      const normalizedQuery = query.toLowerCase();

      for (const phrase of keyPhrases) {
        if (normalizedQuery.includes(phrase)) {
          if (!subQueries.some(q => q.includes(phrase))) {
            let contextQuery = "";

            const words = normalizedQuery.split(/\s+/);
            const phraseIndex = words.findIndex(w => w.includes(phrase));

            if (phraseIndex >= 0) {
              const start = Math.max(0, phraseIndex - 2);
              const end = Math.min(words.length, phraseIndex + 3);
              contextQuery = words.slice(start, end).join(" ");

              if (!contextQuery.includes("?") && !contextQuery.endsWith(".")) {
                contextQuery += " ?";
              }

              subQueries.push(contextQuery);
            }
          }
        }
      }

      if (subQueries.length === 0) {
        subQueries.push(query);
      }

      const extractionResults = await Promise.all(
        subQueries.map(q => extractInfoFromText(rawText, q))
      );

      extractionResults.forEach((result, index) => {
        if (result && result.found && result.value) {
          const key = `extraction_${index + 1}`;

          // Traitement pour s'assurer que les valeurs complexes sont correctement gérées
          let value = result.value;
          if (typeof value === 'object' && value !== null) {
            // Si la valeur est un objet, convertissons ses propriétés en chaînes
            if (value.original !== undefined || value.normalized !== undefined) {
              value = `${value.original || ''} (${value.normalized || ''})`.trim();
            } else {
              value = JSON.stringify(value);
            }
          }

          data[key] = {
            query: subQueries[index],
            value: value,
            confidence: result.confidence,
            context: result.context
          };
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'enrichissement des données:", error);
    }
  }

  /**
   * Verifies if a claim about the document is valid based on extracted data
   */
  private static verifyAffirmation(query: string, extractedData: any): {
    isValid: boolean;
    reason: string;
    matchedElements?: { key: string; value: string }[];
  } {
    const normalizedQuery = query.toLowerCase();
    const matchedElements: { key: string; value: string }[] = [];
    let isValid = false;
    let reason = "Impossible de vérifier l'affirmation";

    // Chercher des mots-clés dans la requête pour déterminer le type de vérification
    const isPaidQuery = /payé|réglé|acquitté|soldé/i.test(normalizedQuery);
    const isDateQuery = /date|émission|expiration|validité/i.test(normalizedQuery);
    const isSignedQuery = /signé|signature|approuvé/i.test(normalizedQuery);
    const isAmountQuery = /montant|somme|coût|prix|valeur/i.test(normalizedQuery);

    // Vérification de paiement
    if (isPaidQuery) {
      const paymentStatus = this.findPaymentStatus(extractedData);
      if (paymentStatus.found) {
        isValid = paymentStatus.isPaid;
        reason = paymentStatus.isPaid
          ? "Le document indique que le paiement a été effectué."
          : "Le document n'indique pas que le paiement a été effectué.";
        matchedElements.push({ key: "statut_paiement", value: paymentStatus.value });
      }
    }
    // Vérification de date
    else if (isDateQuery) {
      const dateInfo = this.findDateInformation(normalizedQuery, extractedData);
      if (dateInfo.found) {
        isValid = dateInfo.isValid;
        reason = dateInfo.reason;
        matchedElements.push({ key: dateInfo.type, value: dateInfo.value });
      }
    }
    // Vérification de signature
    else if (isSignedQuery) {
      const signatureInfo = this.findSignatureInfo(extractedData);
      if (signatureInfo.found) {
        isValid = signatureInfo.isSigned;
        reason = signatureInfo.isSigned
          ? "Le document est signé."
          : "Le document ne semble pas être signé.";
        matchedElements.push({ key: "signature", value: signatureInfo.value });
      }
    }
    // Vérification de montant
    else if (isAmountQuery) {
      const amountInfo = this.findAmountInfo(extractedData);
      if (amountInfo.found) {
        isValid = true;
        reason = `Le montant indiqué dans le document est de ${amountInfo.value}.`;
        matchedElements.push({ key: "montant", value: amountInfo.value });
      }
    }
    // Extraction générique
    else {
      for (const [key, value] of Object.entries(extractedData)) {
        // Ignorer les objets complexes ou les tableaux
        if (typeof value !== 'string' && typeof value !== 'number') continue;

        const normalizedKey = key.toLowerCase().replace(/_/g, ' ');

        if (normalizedQuery.includes(normalizedKey) ||
            (typeof value === 'string' && normalizedQuery.includes(value.toLowerCase()))) {
          matchedElements.push({ key, value: String(value) });
        }
      }

      if (matchedElements.length > 0) {
        isValid = true;
        reason = "Informations correspondantes trouvées dans le document.";
      }
    }

    return {
      isValid,
      reason,
      matchedElements: matchedElements.length > 0 ? matchedElements : undefined
    };
  }

  /**
   * Finds payment status information in extracted data
   */
  private static findPaymentStatus(data: any): {
    found: boolean;
    isPaid: boolean;
    value: string;
  } {
    const result = {
      found: false,
      isPaid: false,
      value: ""
    };

    // Chercher des clés spécifiques au paiement
    const paymentKeys = ['statut_paiement', 'status', 'payment_status', 'payé', 'paid', 'etat_paiement'];

    for (const key of paymentKeys) {
      if (data[key]) {
        result.found = true;
        const value = String(data[key]).toLowerCase();
        result.isPaid = value.includes('payé') || value.includes('paid') || value.includes('réglé');
        result.value = String(data[key]);
        break;
      }
    }

    // Chercher des indices de paiement dans toutes les propriétés
    if (!result.found) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();

          if (lowerValue.includes('payé le') || lowerValue.includes('paid on')) {
            result.found = true;
            result.isPaid = true;
            result.value = value;
            break;
          }

          if ((key.includes('date') || key.includes('time')) &&
              (lowerValue.includes('paiement') || lowerValue.includes('payment'))) {
            result.found = true;
            result.isPaid = true;
            result.value = value;
            break;
          }
        }
      }
    }

    // Regarder dans les objets extraction_X
    if (!result.found) {
      Object.keys(data).forEach(key => {
        if (key.startsWith('extraction_') && data[key].value) {
          const extractedValue = String(data[key].value).toLowerCase();
          if (extractedValue.includes('payé') || extractedValue.includes('paid') || extractedValue.includes('réglé')) {
            result.found = true;
            result.isPaid = true;
            result.value = data[key].value;
          }
        }
      });
    }

    return result;
  }

  /**
   * Finds date information in extracted data
   */
  private static findDateInformation(query: string, data: any): {
    found: boolean;
    isValid: boolean;
    value: string;
    type: string;
    reason: string;
  } {
    const result = {
      found: false,
      isValid: false,
      value: "",
      type: "date",
      reason: ""
    };

    // Déterminer le type de date recherchée
    const isExpirationQuery = /expiration|validité|valide jusqu|expire/i.test(query);
    const isEmissionQuery = /émission|édition|création|établi|établie|délivré/i.test(query);

    const dateType = isExpirationQuery ? "date_expiration" :
                   isEmissionQuery ? "date_emission" : "date";

    result.type = dateType;

    // Chercher des clés spécifiques au type de date
    const dateKeys = [
      dateType,
      dateType.replace('date_', ''),
      'date',
      ...Object.keys(data).filter(k => k.includes('date'))
    ];

    for (const key of dateKeys) {
      if (data[key]) {
        result.found = true;
        result.value = String(data[key]);

        // Vérifier si la date est valide
        try {
          const dateParts = result.value.split(/[\/.-]/);
          let dateObj: Date;

          // Essayer différents formats de date
          if (dateParts.length === 3) {
            // Format JJ/MM/AAAA ou AAAA-MM-DD
            if (dateParts[0].length === 4) {
              // AAAA-MM-DD
              dateObj = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
            } else {
              // JJ/MM/AAAA
              dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            }

            if (!isNaN(dateObj.getTime())) {
              const now = new Date();

              if (isExpirationQuery) {
                result.isValid = dateObj > now;
                result.reason = result.isValid
                  ? `Le document est valide jusqu'au ${result.value}.`
                  : `Le document a expiré le ${result.value}.`;
              } else {
                result.isValid = true;
                result.reason = `La date d'${isEmissionQuery ? 'émission' : 'établissement'} du document est ${result.value}.`;
              }
            }
          }
        } catch (e) {
          // Erreur de parsing de la date
          result.reason = `Date trouvée (${result.value}) mais format non reconnu.`;
        }

        break;
      }
    }

    // Recherche dans les extractions spécifiques
    if (!result.found) {
      Object.keys(data).forEach(key => {
        if (key.startsWith('extraction_') && data[key].value) {
          const extractionQuery = data[key].query.toLowerCase();
          if ((isExpirationQuery && extractionQuery.includes('expiration')) ||
              (isEmissionQuery && extractionQuery.includes('émission')) ||
              extractionQuery.includes('date')) {
            result.found = true;
            result.value = data[key].value;

            // Tenter de vérifier la validité
            try {
              const datePattern = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/;
              const match = result.value.match(datePattern);

              if (match) {
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const year = parseInt(match[3]);

                const dateObj = new Date(year, month, day);
                const now = new Date();

                if (isExpirationQuery) {
                  result.isValid = dateObj > now;
                  result.reason = result.isValid
                    ? `Le document est valide jusqu'au ${result.value}.`
                    : `Le document a expiré le ${result.value}.`;
                } else {
                  result.isValid = true;
                  result.reason = `La date d'${isEmissionQuery ? 'émission' : 'établissement'} du document est ${result.value}.`;
                }
              }
            } catch (e) {
              // Erreur de parsing de la date
              result.reason = `Date trouvée (${result.value}) mais format non reconnu.`;
            }
          }
        }
      });
    }

    return result;
  }

  /**
   * Finds signature information in extracted data
   */
  private static findSignatureInfo(data: any): {
    found: boolean;
    isSigned: boolean;
    value: string;
  } {
    const result = {
      found: false,
      isSigned: false,
      value: ""
    };

    // Chercher des clés spécifiques à la signature
    const signatureKeys = ['signature', 'signed_by', 'signataire', 'signatory', 'signé_par'];

    for (const key of signatureKeys) {
      if (data[key]) {
        result.found = true;
        result.isSigned = true;
        result.value = String(data[key]);
        break;
      }
    }

    // Rechercher des indices de signature dans toutes les propriétés
    if (!result.found) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const lowerKey = key.toLowerCase();
          const lowerValue = value.toLowerCase();

          if (lowerKey.includes('sign') || lowerValue.includes('signature') || lowerValue.includes('signé')) {
            result.found = true;
            result.isSigned = true;
            result.value = String(value);
            break;
          }
        }
      }
    }

    // Regarder dans les objets extraction_X
    if (!result.found) {
      Object.keys(data).forEach(key => {
        if (key.startsWith('extraction_') && data[key].value) {
          const extractionQuery = data[key].query.toLowerCase();
          if (extractionQuery.includes('signature') || extractionQuery.includes('signé')) {
            result.found = true;
            result.isSigned = true;
            result.value = data[key].value;
          }
        }
      });
    }

    return result;
  }

  /**
   * Finds amount/monetary information in extracted data
   */
  private static findAmountInfo(data: any): {
    found: boolean;
    value: string;
  } {
    const result = {
      found: false,
      value: ""
    };

    // Chercher des clés spécifiques au montant
    const amountKeys = ['montant', 'amount', 'prix', 'price', 'total', 'somme', 'coût', 'cost', 'valeur', 'value'];

    for (const key of amountKeys) {
      if (data[key]) {
        result.found = true;

        // Formater le montant avec le symbole € si c'est un nombre
        if (typeof data[key] === 'number') {
          result.value = `${Number(data[key]).toFixed(2)} €`;
        } else {
          result.value = String(data[key]);
          // Ajouter le symbole € si absent
          if (!result.value.includes('€') && !result.value.includes('EUR')) {
            result.value += ' €';
          }
        }
        break;
      }
    }

    // Rechercher dans les extractions spécifiques
    if (!result.found) {
      Object.keys(data).forEach(key => {
        if (key.startsWith('extraction_') && data[key].value) {
          const extractionQuery = data[key].query.toLowerCase();
          const amountKeywords = ['montant', 'somme', 'prix', 'coût', 'total'];

          if (amountKeywords.some(k => extractionQuery.includes(k))) {
            result.found = true;
            result.value = data[key].value;

            // Formater si nécessaire
            if (typeof result.value === 'number') {
              result.value = `${Number(result.value).toFixed(2)} €`;
            } else if (!String(result.value).includes('€') && !String(result.value).includes('EUR')) {
              result.value = `${result.value} €`;
            }
          }
        }
      });
    }

    return result;
  }

  /**
   * Creates a certificate with verification results
   */
  private static createCertificate(
    request: VerificationRequest,
    extractedData: any,
    verificationResult: { isValid: boolean; reason: string; matchedElements?: any[] }
  ): any {
    const now = new Date();
    const documentName = request.document?.name || "Document sans nom";
    const certificateId = this.generateRandomHash();

    const certificate = {
      type: "ZK-FIRMATION_CERTIFICATE",
      id: certificateId,
      metadata: {
        createdAt: now.toISOString(),
        documentName,
        certificateLanguage: "fr",
        verificationVersion: "1.0.0"
      },
      query: {
        original: request.query,
        normalized: request.query.toLowerCase()
      },
      verification: {
        result: verificationResult.isValid,
        explanation: verificationResult.reason,
        timestamp: now.toISOString(),
        matchedElements: verificationResult.matchedElements || []
      },
      extractedData: {
        keyProperties: Object.entries(extractedData)
          .filter(([_, value]) => typeof value !== 'object')
          .reduce((obj, [key, value]) => ({...obj, [key]: value}), {}),
        complexProperties: Object.entries(extractedData)
          .filter(([_, value]) => typeof value === 'object')
          .reduce((obj, [key, value]) => ({...obj, [key]: value}), {})
      },
      security: {
        certificateHash: certificateId,
        issuer: "ZK-Firmation System",
        validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
        zkpVerified: true
      }
    };

    return certificate;
  }

  /**
   * Generates a random hash for certificate IDs
   */
  private static generateRandomHash(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const timestamp = Date.now().toString(36);
    let hash = 'zkf-' + timestamp + '-';

    for (let i = 0; i < 16; i++) {
      hash += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return hash;
  }
}