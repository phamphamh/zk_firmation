/**
 * Service de génération de documents mockés pour les tests
 * Permet de tester l'extraction de texte et la vérification de documents sans OCR réel
 */

import { extractInfoFromText } from './document-service';

/**
 * Interface représentant un document mocké
 */
export interface MockDocument {
  id: string;
  filename: string;
  title: string;
  type: 'contrat' | 'facture' | 'identité';
  content: string;
  metadata: Record<string, any>;
}

/**
 * Type de vérification à effectuer sur un document
 */
export type VerificationType =
  | 'validité'
  | 'paiement'
  | 'expiration'
  | 'identité'
  | 'montant'
  | 'signature';

/**
 * Collection de documents mockés pour tests
 */
export const MOCK_DOCUMENTS: MockDocument[] = [
  // Document 1: Facture EDF
  {
    id: 'doc-001',
    filename: 'facture-edf-2023.pdf',
    title: 'Facture EDF',
    type: 'facture',
    content: `
FACTURE D'ÉLECTRICITÉ
EDF SA au capital de 1 551 810 543 euros
RCS Paris 552 081 317
Siège social : 22-30, avenue de Wagram 75008 Paris

Référence client: EDF23956784
Référence facture: F23-78945612
Date d'émission: 15/03/2023

Client:
M. DUPONT Jean
123 Rue des Lilas
75020 PARIS

FACTURE DU 15/02/2023 AU 14/03/2023

Consommation: 342 kWh
Prix unitaire HT: 0,1740 €/kWh
Montant HT: 59,51 €
TVA (20%): 11,90 €
MONTANT TOTAL TTC: 71,41 €

STATUT: PAYÉ le 20/03/2023
Mode de paiement: Prélèvement automatique

Prochain relevé prévu: 15/04/2023

Service client: 09 69 32 15 15 (appel non surtaxé)
www.edf.fr
    `,
    metadata: {
      dateEmission: '15/03/2023',
      montant: 71.41,
      status: 'PAYÉ',
      datePaiement: '20/03/2023',
      reference: 'F23-78945612',
      client: 'DUPONT Jean'
    }
  },

  // Document 2: Contrat de location
  {
    id: 'doc-002',
    filename: 'contrat-location-2023.pdf',
    title: 'Contrat de location',
    type: 'contrat',
    content: `
CONTRAT DE LOCATION
(Loi n° 89-462 du 6 juillet 1989)

ENTRE LES SOUSSIGNÉS:

BAILLEUR:
SCI HABITAT PARIS
35 Avenue Victor Hugo
75016 PARIS
SIRET: 78945612300014

ET

LOCATAIRE:
Mme MARTIN Sophie
née le, 12/04/1985 à Lyon
Carte d'identité n° 123456789
Email: sophie.martin@email.com
Tél: 06 12 34 56 78

IL A ÉTÉ CONVENU CE QUI SUIT:

Article 1: OBJET DU CONTRAT
Le présent contrat a pour objet la location d'un appartement situé au:
45 Rue des Roses, 75011 PARIS
Type: F3 - Surface: 65 m²

Article 2: DURÉE DU BAIL
Le présent bail est consenti pour une durée de TROIS ANS,
commençant à courir le 01/06/2023 pour se terminer le 31/05/2026.

Article 3: LOYER ET CHARGES
Le loyer mensuel est fixé à 1200 € (mille deux cents euros).
Provision sur charges: 150 € par mois

Article 4: DÉPÔT DE GARANTIE
Le dépôt de garantie est fixé à la somme de 1200 € (un mois de loyer).

Fait à Paris, le 15/05/2023, en deux exemplaires.

Signature du bailleur:                 Signature du locataire:
P. Durand                              S. Martin
    `,
    metadata: {
      dateSignature: '15/05/2023',
      dateDebut: '01/06/2023',
      dateFin: '31/05/2026',
      loyer: 1200,
      locataire: 'MARTIN Sophie',
      adresse: '45 Rue des Roses, 75011 PARIS',
      signatureBailleur: 'P. Durand',
      signatureLocataire: 'S. Martin'
    }
  },

  // Document 3: Carte d'identité
  {
    id: 'doc-003',
    filename: 'carte-identite.pdf',
    title: 'Carte Nationale d\'Identité',
    type: 'identité',
    content: `
RÉPUBLIQUE FRANÇAISE
CARTE NATIONALE D'IDENTITÉ

Nom: LAMBERT
Prénom: Marie
Né(e) le: 23/09/1990
à: Bordeaux (33)
Taille: 1m68
Sexe: F
Nationalité: Française
Date d'émission: 14/02/2020
Date d'expiration: 14/02/2030

N° de carte: 1234567890AB
    `,
    metadata: {
      nom: 'LAMBERT',
      prenom: 'Marie',
      dateNaissance: '23/09/1990',
      lieuNaissance: 'Bordeaux (33)',
      dateEmission: '14/02/2020',
      dateExpiration: '14/02/2030',
      numero: '1234567890AB'
    }
  }
];

/**
 * Récupère un document mocké par son ID
 * @param id - Identifiant du document
 * @returns Le document correspondant ou undefined
 */
export function getMockDocumentById(id: string): MockDocument | undefined {
  return MOCK_DOCUMENTS.find(doc => doc.id === id);
}

/**
 * Récupère tous les documents mockés
 * @returns Liste des documents mockés
 */
export function getAllMockDocuments(): MockDocument[] {
  return [...MOCK_DOCUMENTS];
}

// Amélioration de la fonction extractInfoFromText pour qu'elle fonctionne sans API réelle dans le contexte mock
const mockExtractInfoFromText = async (text: string, query: string): Promise<any> => {
  console.log(`📋 Mock extraction: "${query}"`);

  // Normaliser la requête
  const normalizedQuery = query.toLowerCase();

  // Résultat par défaut
  let result = {
    found: false,
    value: null,
    confidence: 0,
    context: null
  };

  // Recherche d'informations spécifiques basée sur des mots-clés
  if (normalizedQuery.includes('paiement') || normalizedQuery.includes('payé') || normalizedQuery.includes('réglé')) {
    // Rechercher le statut de paiement
    const paymentRegex = /STATUT\s*:\s*(PAYÉ|NON PAYÉ|EN ATTENTE)/i;
    const match = text.match(paymentRegex);
    if (match) {
      result = {
        found: true,
        value: match[1],
        confidence: 0.95,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    } else if (text.toLowerCase().includes('payé')) {
      // Recherche plus générale
      result = {
        found: true,
        value: "PAYÉ",
        confidence: 0.85,
        context: "Le document indique que le paiement a été effectué."
      };
    }
  } else if (normalizedQuery.includes('montant') || normalizedQuery.includes('total') || normalizedQuery.includes('somme')) {
    // Rechercher un montant
    const montantRegex = /MONTANT\s*.*?\s*:\s*(\d+[\.,]\d+)\s*€/i;
    const match = text.match(montantRegex) || text.match(/(\d+[\.,]\d+)\s*€/);
    if (match) {
      result = {
        found: true,
        value: match[1].replace(',', '.'),
        confidence: 0.9,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    }
  } else if (normalizedQuery.includes('date') && (normalizedQuery.includes('expiration') || normalizedQuery.includes('validité'))) {
    // Rechercher une date d'expiration
    const dateRegex = /Date\s*d['']expiration\s*:\s*(\d{2}\/\d{2}\/\d{4})/i;
    const match = text.match(dateRegex);
    if (match) {
      result = {
        found: true,
        value: match[1],
        confidence: 0.95,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    }
  } else if (normalizedQuery.includes('signature')) {
    // Rechercher une signature
    const signatureRegex = /Signature\s*(du|de la|des)/i;
    const match = text.match(signatureRegex);
    if (match) {
      result = {
        found: true,
        value: "Signé",
        confidence: 0.8,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    }
  } else if (normalizedQuery.includes('nom') || normalizedQuery.includes('personne')) {
    // Rechercher un nom
    const nomRegex = /Nom\s*:\s*([A-Z]+)/i;
    const match = text.match(nomRegex);
    if (match) {
      result = {
        found: true,
        value: match[1],
        confidence: 0.9,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    }
  } else if (normalizedQuery.includes('loyer')) {
    // Rechercher un montant de loyer
    const loyerRegex = /loyer\s*.*?\s*:\s*(\d+)\s*€/i;
    const match = text.match(loyerRegex);
    if (match) {
      result = {
        found: true,
        value: match[1],
        confidence: 0.9,
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      };
    }
  }

  // Simuler un délai comme pour une API réelle
  await new Promise(resolve => setTimeout(resolve, 300));

  return result;
};

/**
 * Vérifie si une affirmation est valide pour un document donné
 * @param documentId - ID du document à vérifier
 * @param query - Affirmation ou question à vérifier
 * @returns Résultat de la vérification avec explication
 */
export async function verifyMockDocument(documentId: string, query: string): Promise<{
  isValid: boolean;
  reason: string;
  documentInfo: MockDocument | null;
  extractedInfo: Record<string, any>;
}> {
  // Récupérer le document
  const document = getMockDocumentById(documentId);
  if (!document) {
    return {
      isValid: false,
      reason: "Document introuvable",
      documentInfo: null,
      extractedInfo: {}
    };
  }

  // Normaliser la requête
  const normalizedQuery = query.toLowerCase();

  // Extraire des informations du document en fonction de la requête
  const extractedInfo: Record<string, any> = {};

  // Détecter le type de vérification demandée
  let verificationType: VerificationType | null = null;

  if (normalizedQuery.includes('payé') || normalizedQuery.includes('paiement') || normalizedQuery.includes('réglé')) {
    verificationType = 'paiement';
  } else if (normalizedQuery.includes('expire') || normalizedQuery.includes('expiration') || normalizedQuery.includes('valide jusqu')) {
    verificationType = 'expiration';
  } else if (normalizedQuery.includes('valide') || normalizedQuery.includes('validité')) {
    verificationType = 'validité';
  } else if (normalizedQuery.includes('montant') || normalizedQuery.includes('somme') || normalizedQuery.includes('coût')) {
    verificationType = 'montant';
  } else if (normalizedQuery.includes('signé') || normalizedQuery.includes('signature')) {
    verificationType = 'signature';
  } else if (normalizedQuery.includes('identité') || normalizedQuery.includes('personne')) {
    verificationType = 'identité';
  }

  // Effectuer une véritable analyse du contenu pour répondre à la requête
  // en utilisant la fonction mock d'extraction d'information
  try {
    // Extraire l'information pertinente selon le type de vérification
    if (verificationType === 'paiement' && document.type === 'facture') {
      const paymentInfo = await mockExtractInfoFromText(document.content, "statut de paiement");
      extractedInfo.paiement = paymentInfo.value || document.metadata.status;
      extractedInfo.datePaiement = document.metadata.datePaiement;

      const isPaid = extractedInfo.paiement?.toLowerCase().includes('payé') ||
                     document.content.toLowerCase().includes('payé');

      return {
        isValid: isPaid,
        reason: isPaid
          ? `Le document indique que la facture a été payée le ${extractedInfo.datePaiement}.`
          : "La facture n'a pas été payée selon les informations du document.",
        documentInfo: document,
        extractedInfo
      };
    }

    if (verificationType === 'montant') {
      let montantInfo = await mockExtractInfoFromText(document.content, "montant");
      if (!montantInfo.found) {
        montantInfo = await mockExtractInfoFromText(document.content, "total");
      }

      extractedInfo.montant = montantInfo.value ||
        (document.type === 'facture' ? document.metadata.montant :
         document.type === 'contrat' ? document.metadata.loyer : null);

      return {
        isValid: extractedInfo.montant !== null,
        reason: extractedInfo.montant
          ? `Le montant indiqué dans le document est de ${extractedInfo.montant}€.`
          : "Aucun montant n'a été trouvé dans le document.",
        documentInfo: document,
        extractedInfo
      };
    }

    if (verificationType === 'expiration' || verificationType === 'validité') {
      let dateInfo = null;

      if (document.type === 'identité') {
        dateInfo = await mockExtractInfoFromText(document.content, "date d'expiration");
        extractedInfo.dateExpiration = dateInfo?.value || document.metadata.dateExpiration;

        // Vérifier si la date d'expiration est dans le futur
        const expDate = new Date(extractedInfo.dateExpiration.split('/').reverse().join('-'));
        const isValid = expDate > new Date();

        return {
          isValid,
          reason: isValid
            ? `Le document est valide jusqu'au ${extractedInfo.dateExpiration}.`
            : `Le document a expiré le ${extractedInfo.dateExpiration}.`,
          documentInfo: document,
          extractedInfo
        };
      } else if (document.type === 'contrat') {
        dateInfo = await mockExtractInfoFromText(document.content, "date de fin");
        extractedInfo.dateFin = dateInfo?.value || document.metadata.dateFin;

        // Vérifier si la date de fin est dans le futur
        const endDate = new Date(extractedInfo.dateFin.split('/').reverse().join('-'));
        const isValid = endDate > new Date();

        return {
          isValid,
          reason: isValid
            ? `Le contrat est valide jusqu'au ${extractedInfo.dateFin}.`
            : `Le contrat a expiré le ${extractedInfo.dateFin}.`,
          documentInfo: document,
          extractedInfo
        };
      }
    }

    if (verificationType === 'signature') {
      let signatureInfo = await mockExtractInfoFromText(document.content, "signature");
      extractedInfo.signed = signatureInfo.found ||
        document.content.toLowerCase().includes('signature') ||
        (document.metadata.signatureBailleur && document.metadata.signatureLocataire);

      return {
        isValid: extractedInfo.signed,
        reason: extractedInfo.signed
          ? "Le document est correctement signé par toutes les parties."
          : "Le document ne semble pas être signé par toutes les parties requises.",
        documentInfo: document,
        extractedInfo
      };
    }

    if (verificationType === 'identité') {
      let nomInfo = await mockExtractInfoFromText(document.content, "nom");
      extractedInfo.nom = nomInfo.value || document.metadata.nom || document.metadata.client || document.metadata.locataire?.split(' ')[1];

      let prenomInfo = await mockExtractInfoFromText(document.content, "prénom");
      extractedInfo.prenom = prenomInfo.value || document.metadata.prenom || document.metadata.locataire?.split(' ')[0];

      const hasIdentityInfo = extractedInfo.nom || extractedInfo.prenom;

      return {
        isValid: hasIdentityInfo,
        reason: hasIdentityInfo
          ? `Le document contient des informations d'identité pour ${extractedInfo.prenom || ''} ${extractedInfo.nom || ''}.`
          : "Le document ne contient pas d'informations d'identité clairement identifiables.",
        documentInfo: document,
        extractedInfo
      };
    }

    // Si aucune vérification spécifique n'est détectée, faire une analyse générale
    return {
      isValid: true,
      reason: `Document analysé: ${document.title}. Aucune vérification spécifique demandée.`,
      documentInfo: document,
      extractedInfo: { ...document.metadata }
    };

  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return {
      isValid: false,
      reason: `Erreur lors de l'analyse du document: ${error.message}`,
      documentInfo: document,
      extractedInfo
    };
  }
}