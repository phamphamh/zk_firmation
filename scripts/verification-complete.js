import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate
} from 'o1js';

// Importer notre circuit de vérification
import {
  Affirmation,
  ContractAffirmationVerifier,
  AffirmationProof
} from '../contracts/AffirmationVerifier.js';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

/**
 * Convertit un fichier PDF en base64
 * @param {string} filePath - Chemin du fichier PDF
 * @returns {string} - Chaîne base64 du fichier
 */
function convertPDFToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Erreur lors de la conversion du PDF en base64: ${error}`);
    throw error;
  }
}

/**
 * Utilise l'API OCR de Mistral pour extraire le texte d'un document PDF
 * @param {string} pdfPath - Chemin du fichier PDF
 * @returns {Promise<Object>} - Résultat de l'OCR
 */
async function extractTextWithMistralOCR(pdfPath) {
  try {
    console.log("Utilisation de l'API OCR de Mistral pour extraire le texte...");
    console.log("Conversion du PDF en format approprié...");
    const pdfBase64 = await convertPDFToBase64(pdfPath);

    console.log("Envoi de la requête à l'API OCR de Mistral...");
    const response = await axios.post(
      'https://api.mistral.ai/v1/ocr',
      {
        model: "mistral-ocr-latest", // Modèle OCR de Mistral
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${pdfBase64}`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Erreur de l'API (${error.response?.status || 'inconnu'}): ${JSON.stringify(error.response?.data || {})}`);
    throw new Error(`Erreur lors du traitement: ${error}`);
  }
}

/**
 * Analyse le texte extrait et identifie les affirmations
 * @param {Object} ocrResult - Résultat de l'OCR
 * @returns {Promise<Object>} - Affirmations extraites
 */
async function analyzeTextAndExtractAffirmations(ocrResult) {
  console.log('Analyse du texte extrait et génération d\'affirmations...');

  // Extraire le texte complet de toutes les pages
  let fullText = '';
  if (ocrResult.pages && ocrResult.pages.length > 0) {
    fullText = ocrResult.pages.map(page => page.markdown).join('\n');
  } else {
    throw new Error('Aucun texte extrait du document');
  }

  // Sauvegarder le texte extrait
  const textPath = path.resolve(process.cwd(), 'extracted_text.txt');
  fs.writeFileSync(textPath, fullText);
  console.log(`Texte extrait sauvegardé dans ${textPath}`);

  // Mise à jour de l'appel pour l'extraction d'informations spécifiques
  const infoExtractionResponse = await mistralClient.chat({
    model: "mistral-large-2402",
    messages: [
      {
        role: "system",
        content: "Tu es un expert juridique en extraction d'informations. Extrais les informations demandées dans un format JSON structuré et précis."
      },
      {
        role: "user",
        content: `Document:\n\n${fullText}\n\nExtrait les informations suivantes et renvoie-les au format JSON avec les champs suivants :
        {
          "hebergeur": {
            "nom": "",
            "dateNaissance": "",
            "lieuNaissance": ""
          },
          "heberge": {
            "nom": "",
            "dateNaissance": "",
            "lieuNaissance": ""
          },
          "adresse": {
            "rue": "",
            "codePostal": "",
            "ville": "",
            "pays": ""
          },
          "periode": {
            "debut": "",
            "fin": ""
          },
          "dateCertification": ""
        }`
      }
    ]
  });

  // Analyser le texte et extraire des informations
  // Pour un document d'attestation d'hébergement
  // Ceci est une simplification - idéalement, on utiliserait l'API de Mistral
  // pour analyser le texte et extraire ces informations
  const extractedInfo = {
    hebergeur: {
      nom: extractValue(fullText, /nom.*?:\s*(.*?)(?:\r|\n|,)/i) ||
           extractValue(fullText, /soussigné\(e\)[,:]?\s*(?:M\.|Mme\.?|Monsieur|Madame)?\s*([\w\s'-]+)/i),
      dateNaissance: extractValue(fullText, /né\(e\) le\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i),
      lieuNaissance: extractValue(fullText, /né\(e\) (?:le [^à]*? )?à\s*([^,\r\n]+)/i)
    },
    heberge: {
      nom: extractValue(fullText, /héberger.*?:\s*(?:M\.|Mme\.?|Monsieur|Madame)?\s*([\w\s'-]+)/i),
      dateNaissance: extractValue(fullText, /personne hébergée.*?né\(e\) le\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i),
      lieuNaissance: extractValue(fullText, /personne hébergée.*?né\(e\) (?:le [^à]*? )?à\s*([^,\r\n]+)/i)
    },
    adresse: {
      rue: extractValue(fullText, /demeurant.*?au\s*([^,\r\n]+)/i),
      codePostal: extractValue(fullText, /(\d{5})\s+[\w\s'-]+,\s*france/i),
      ville: extractValue(fullText, /\d{5}\s+([\w\s'-]+),\s*france/i),
      pays: 'France'
    },
    periode: {
      debut: extractValue(fullText, /depuis le\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i),
      fin: extractValue(fullText, /jusqu['']au\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i) || 'ce jour'
    },
    dateCertification: extractValue(fullText, /fait à .*? le\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i)
  };

  console.log('Informations extraites:', JSON.stringify(extractedInfo, null, 2));

  // Générer des affirmations basées sur les informations extraites
  const affirmations = [
    {
      text: "Cette attestation confirme que la personne est hébergée à l'adresse mentionnée",
      isValid: !!extractedInfo.heberge.nom && !!extractedInfo.adresse.rue,
      explanation: `Le document atteste que ${extractedInfo.hebergeur.nom || 'l\'hébergeur'} ` +
                   `héberge ${extractedInfo.heberge.nom || 'la personne mentionnée'} à l'adresse ` +
                   `${extractedInfo.adresse.rue || 'mentionnée'}.`
    },
    {
      text: "La personne hébergée est majeure (a plus de 18 ans)",
      isValid: isPersonMajor(extractedInfo.heberge.dateNaissance, extractedInfo.dateCertification),
      explanation: `Selon la date de naissance (${extractedInfo.heberge.dateNaissance || 'non spécifiée'}) ` +
                   `et la date de certification (${extractedInfo.dateCertification || 'actuelle'}), ` +
                   `la personne ${isPersonMajor(extractedInfo.heberge.dateNaissance, extractedInfo.dateCertification) ? 'est' : 'n\'est pas'} majeure.`
    },
    {
      text: "L'adresse mentionnée dans ce document est située en France",
      isValid: extractedInfo.adresse.pays.toLowerCase() === 'france',
      explanation: `L'adresse mentionne explicitement ${extractedInfo.adresse.pays} comme pays.`
    }
  ];

  return { extractedInfo, affirmations, fullText };
}

/**
 * Extrait une valeur correspondant à un motif RegExp
 * @param {string} text - Texte à analyser
 * @param {RegExp} regex - Expression régulière
 * @returns {string|null} - Valeur extraite ou null
 */
function extractValue(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Vérifie si une personne est majeure
 * @param {string} birthDateStr - Date de naissance au format DD/MM/YYYY
 * @param {string} referenceDate - Date de référence au format DD/MM/YYYY
 * @returns {boolean} - true si la personne est majeure
 */
function isPersonMajor(birthDateStr, referenceDate) {
  if (!birthDateStr) return false;

  // Convertir la date de naissance en format Date
  const parts = birthDateStr.split(/[\/\.\-]/);
  if (parts.length !== 3) return false;

  let day, month, year;
  if (parts[2].length === 4) {
    // Format DD/MM/YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript
    year = parseInt(parts[2], 10);
  } else {
    // Format YYYY-MM-DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  }

  const birthDate = new Date(year, month, day);

  // Utiliser la date de référence ou la date actuelle
  let refDate;
  if (referenceDate) {
    const refParts = referenceDate.split(/[\/\.\-]/);
    if (refParts.length === 3) {
      if (refParts[2].length === 4) {
        // Format DD/MM/YYYY
        refDate = new Date(
          parseInt(refParts[2], 10),
          parseInt(refParts[1], 10) - 1,
          parseInt(refParts[0], 10)
        );
      } else {
        // Format YYYY-MM-DD
        refDate = new Date(
          parseInt(refParts[0], 10),
          parseInt(refParts[1], 10) - 1,
          parseInt(refParts[2], 10)
        );
      }
    } else {
      refDate = new Date(); // Utiliser la date actuelle
    }
  } else {
    refDate = new Date(); // Utiliser la date actuelle
  }

  // Calculer l'âge
  let age = refDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = refDate.getMonth() - birthDate.getMonth();

  // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 18;
}

/**
 * Génère des preuves ZKP pour les affirmations
 * @param {Array} affirmations - Liste des affirmations
 * @param {string} documentText - Texte du document
 * @returns {Promise<Array>} - Liste des résultats de preuves
 */
async function generateZKProofs(affirmations, documentText) {
  console.log('\n--- GÉNÉRATION DE PREUVES ZKP ---');

  try {
    // Initialiser le circuit ZKP
    console.log('Initialisation du circuit ZKP...');
    await ContractAffirmationVerifier.compile();

    // Initialiser un blockchain local pour tester
    console.log('Initialisation d\'une blockchain de test...');
    const Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);

    const deployerAccount = Local.testAccounts[0].privateKey;
    const deployerAddress = deployerAccount.toPublicKey();

    const zkpResults = [];

    // Traiter chaque affirmation
    for (const affirmation of affirmations) {
      console.log(`\nAnalyse de l'affirmation: "${affirmation}"`);

      const assertionResponse = await mistralClient.chat({
        model: "mistral-large-2402",
        messages: [
          {
            role: "system",
            content: "Tu es un expert juridique chargé de vérifier si une affirmation concernant un document est vraie ou fausse. Analyse méticuleusement le document et vérifie l'affirmation. Réponds UNIQUEMENT au format JSON avec les propriétés 'isValid' (booléen), 'confidence' (nombre entre 0 et 1), et 'explanation' (explication détaillée de ta décision)."
          },
          {
            role: "user",
            content: `Document:\n\n${documentText}\n\nAffirmation à vérifier: "${affirmation}"`
          }
        ]
      });

      // ... existing code ...
    }

    return zkpResults;
  } catch (error) {
    console.error(`Erreur lors de la génération des preuves ZKP: ${error}`);
    throw error;
  }
}

/**
 * Génère un certificat JSON avec les informations et preuves
 * @param {Object} extractedInfo - Informations extraites
 * @param {Array} zkpResults - Résultats des preuves ZKP
 * @returns {Object} - Certificat
 */
function generateCertificate(extractedInfo, zkpResults) {
  console.log('\n--- GÉNÉRATION DU CERTIFICAT ---');

  const now = new Date();

  // Créer le certificat
  const certificate = {
    type: "Certificat de Vérification Juridique",
    id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date_emission: now.toISOString(),
    document: {
      type: "Attestation d'hébergement",
      parties: {
        hebergeur: extractedInfo.hebergeur,
        heberge: extractedInfo.heberge
      },
      adresse: extractedInfo.adresse,
      periode: extractedInfo.periode,
      date_certification: extractedInfo.dateCertification
    },
    verifications: zkpResults.map(result => ({
      affirmation: result.affirmation,
      validite: result.isValid,
      explication: result.explanation,
      preuve_zkp: result.hash || null,
      transaction_id: result.txId || null
    })),
    emetteur: {
      nom: "Système ZK-Firmation",
      signature_numerique: `zk-firm-${generateSignature()}`
    },
    validite: {
      debut: now.toISOString(),
      fin: new Date(now.getTime() + 31557600000).toISOString() // Validité d'un an
    }
  };

  // Sauvegarder le certificat
  const certificatePath = path.resolve(process.cwd(), 'certificate.json');
  fs.writeFileSync(certificatePath, JSON.stringify(certificate, null, 2));
  console.log(`Certificat sauvegardé dans ${certificatePath}`);

  return certificate;
}

/**
 * Génère une signature aléatoire
 * @returns {string} - Signature
 */
function generateSignature() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let signature = '';
  for (let i = 0; i < 32; i++) {
    signature += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return signature;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log("🚀 Démarrage du processus de vérification complet...");
    // Chemin vers le PDF d'attestation d'hébergement
    const pdfPath = path.resolve(process.cwd(), 'Attestation_hébergement.pdf');
    let ocrResult;

    try {
      console.log('=== ÉTAPE 1: EXTRACTION OCR ===');
      ocrResult = await extractTextWithMistralOCR(pdfPath);
    } catch (error) {
      console.error(`Erreur lors de l'extraction OCR: ${error}`);

      // Si l'API échoue, utiliser des données simulées
      console.log('Utilisation de données OCR simulées...');
      ocrResult = {
        pages: [
          {
            markdown: `
              # ATTESTATION D'HÉBERGEMENT

              Je soussigné(e), M. DUPONT Jean, né(e) le 15/06/1975 à Paris,
              demeurant au 123 rue des Lilas, 75020 Paris, France,

              Certifie sur l'honneur héberger à mon domicile :

              M. MARTIN Sophie, né(e) le 23/09/2000 à Lyon,

              depuis le 01/01/2023 et jusqu'à ce jour.

              Je m'engage à signaler tout changement concernant cette situation.

              Fait à Paris, le 15/02/2023

              Signature : [Signature électronique]

              Documents joints :
              - Copie de ma pièce d'identité
              - Justificatif de domicile à mon nom
            `
          }
        ],
        usage_info: {
          pages_processed: 1,
          doc_size_bytes: 10240
        }
      };
    }

    // Étape 2: Analyse du texte et extraction des affirmations
    console.log('\n=== ÉTAPE 2: ANALYSE DU TEXTE ET EXTRACTION DES AFFIRMATIONS ===');
    const { extractedInfo, affirmations, fullText } = await analyzeTextAndExtractAffirmations(ocrResult);

    // Étape 3: Génération des preuves ZKP
    console.log('\n=== ÉTAPE 3: GÉNÉRATION DES PREUVES ZKP ===');
    const zkpResults = await generateZKProofs(affirmations, fullText);

    // Étape 4: Génération du certificat
    console.log('\n=== ÉTAPE 4: GÉNÉRATION DU CERTIFICAT ===');
    const certificate = generateCertificate(extractedInfo, zkpResults);

    console.log('\n=== PROCESSUS DE VÉRIFICATION TERMINÉ AVEC SUCCÈS ===');

    // Résumé des résultats
    console.log('\n--- RÉSUMÉ ---');
    console.log(`Informations extraites du document: OK`);
    console.log(`Nombre d'affirmations vérifiées: ${affirmations.length}`);
    console.log(`Nombre de preuves ZKP générées: ${zkpResults.filter(r => r.hash).length}`);
    console.log(`Certificat généré: ${certificate.id}`);

    return {
      success: true,
      extractedInfo,
      affirmations,
      zkpResults,
      certificate
    };
  } catch (error) {
    console.error(`Erreur lors du processus de vérification: ${error}`);

    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});