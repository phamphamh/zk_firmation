import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import dotenv from 'dotenv';

// Importer nos modules d'utilitaires
import { extractAndSaveText } from './utils/document-extractor.js';
import { InfoExtractor } from './utils/info-extractor.js';
import { ZkpManager } from './utils/zkp-generic.js';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Système de vérification universelle ZKP
 * @param {string} documentPath - Chemin du document à vérifier
 * @param {string} query - Demande d'information à prouver
 * @param {boolean} useAI - Utiliser l'IA pour l'extraction
 */
async function verifyDocument(documentPath, query, useAI = true) {
  console.log('\n🚀 ZK-FIRMATION - SYSTÈME DE VÉRIFICATION UNIVERSELLE');
  console.log('==================================================');

  try {
    // ÉTAPE 1: Extraction du texte du document
    console.log('\n=== 1️⃣ EXTRACTION DU TEXTE DU DOCUMENT ===');
    const { text, outputPath } = await extractAndSaveText(documentPath);
    console.log(`✓ Texte extrait : ${text.length} caractères`);

    // ÉTAPE 2: Extraction de l'information spécifique selon la requête
    console.log('\n=== 2️⃣ EXTRACTION DE L\'INFORMATION SPÉCIFIQUE ===');
    console.log(`📝 Requête : "${query}"`);

    const extractor = new InfoExtractor(useAI);
    const extractionResult = await extractor.extractInfo(text, query);

    if (!extractionResult.found) {
      console.error('❌ Information non trouvée dans le document');
      return {
        success: false,
        error: 'Information non trouvée dans le document'
      };
    }

    console.log(`✅ Information extraite : "${extractionResult.value}"`);
    console.log(`💪 Confiance : ${extractionResult.confidence * 100}%`);

    // Sauvegarder le résultat d'extraction
    const extractionResultPath = extractor.saveExtractionResult(extractionResult, query, outputPath);

    // ÉTAPE 3: Préparation du document pour ZKP
    console.log('\n=== 3️⃣ PRÉPARATION DU DOCUMENT POUR ZKP ===');

    // Extraire le type de document du chemin ou du texte
    const documentType = extractDocumentType(documentPath, text);
    console.log(`📄 Type de document détecté : ${documentType}`);

    // Créer l'objet document pour le ZKP
    const documentInfo = {
      documentType: documentType,
      text: text,
      extractedValue: extractionResult.value,
      query: query,
      // Tenter de détecter si le document est signé
      hasSignature: text.toLowerCase().includes('sign') ||
                   text.toLowerCase().includes('tampon') ||
                   text.toLowerCase().includes('cachet'),
      date: extractDocumentDate(text),
      source: path.basename(documentPath)
    };

    console.log(`📝 Document préparé pour ZKP`);

    // ÉTAPE 4: Génération des preuves ZKP
    console.log('\n=== 4️⃣ GÉNÉRATION DES PREUVES ZKP ===');

    // Initialiser le gestionnaire ZKP
    const zkpManager = new ZkpManager();
    await zkpManager.initialize();

    // Générer la preuve adaptée à la requête
    const proofResult = await zkpManager.generateProofFromQuery(
      query,
      extractionResult.value,
      documentInfo
    );

    if (!proofResult.success) {
      console.error(`❌ Échec de la génération de preuve: ${proofResult.error}`);
      return {
        success: false,
        error: proofResult.error
      };
    }

    console.log(`✅ Preuve générée avec succès`);
    console.log(`🔑 Hash de la preuve: ${proofResult.infoHash}`);
    console.log(`📜 Hash du document: ${proofResult.documentHash}`);

    // ÉTAPE 5: Génération du certificat
    console.log('\n=== 5️⃣ GÉNÉRATION DU CERTIFICAT ===');

    const certificate = zkpManager.generateCertificate(proofResult, documentInfo, query);

    console.log('\n✅ PROCESSUS DE VÉRIFICATION TERMINÉ AVEC SUCCÈS');
    console.log('==================================================');
    console.log(`📊 Affirmation vérifiée: "${certificate.validatedAffirmation.statement}"`);
    console.log(`📅 Certificat valable jusqu'au: ${new Date(certificate.validUntil).toLocaleDateString('fr-FR')}`);

    return {
      success: true,
      certificate,
      proofResult,
      extractionResult
    };
  } catch (error) {
    console.error(`❌ Erreur lors du processus de vérification: ${error.message}`);
    console.error(error.stack);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extrait le type de document à partir du chemin ou du texte
 * @param {string} documentPath - Chemin du document
 * @param {string} text - Texte du document
 * @returns {string} - Type de document
 */
function extractDocumentType(documentPath, text) {
  // D'abord, essayer de trouver le type dans le texte
  const textLower = text.toLowerCase();

  if (textLower.includes('attestation d\'hébergement') || textLower.includes('attestation d\'hébergement')) {
    return "Attestation d'hébergement";
  } else if (textLower.includes('certificat de scolarité')) {
    return "Certificat de scolarité";
  } else if (textLower.includes('bulletin de salaire') || textLower.includes('fiche de paie')) {
    return "Bulletin de salaire";
  } else if (textLower.includes('facture')) {
    return "Facture";
  } else if (textLower.includes('contrat de travail')) {
    return "Contrat de travail";
  } else if (textLower.includes('contrat de location') || textLower.includes('bail')) {
    return "Contrat de location";
  } else if (textLower.includes('quittance de loyer')) {
    return "Quittance de loyer";
  } else if (textLower.includes('relevé d\'identité bancaire') || textLower.includes('rib')) {
    return "Relevé d'identité bancaire";
  }

  // Si pas trouvé dans le texte, utiliser le nom du fichier
  const filename = path.basename(documentPath).toLowerCase();

  if (filename.includes('hebergement') || filename.includes('attestation')) {
    return "Attestation d'hébergement";
  } else if (filename.includes('scolarite') || filename.includes('scolaire')) {
    return "Certificat de scolarité";
  } else if (filename.includes('salaire') || filename.includes('paie')) {
    return "Bulletin de salaire";
  } else if (filename.includes('facture')) {
    return "Facture";
  } else if (filename.includes('contrat') && filename.includes('travail')) {
    return "Contrat de travail";
  } else if (filename.includes('contrat') && (filename.includes('location') || filename.includes('bail'))) {
    return "Contrat de location";
  } else if (filename.includes('quittance')) {
    return "Quittance de loyer";
  } else if (filename.includes('rib') || filename.includes('bancaire')) {
    return "Relevé d'identité bancaire";
  }

  // Par défaut
  return "Document légal";
}

/**
 * Extrait la date du document
 * @param {string} text - Texte du document
 * @returns {string} - Date au format DD/MM/YYYY ou chaîne vide
 */
function extractDocumentDate(text) {
  // Recherche de motifs de date courants
  const datePatterns = [
    /fait (?:à|le|en date du).*?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})/i,
    /en date du.*?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})/i,
    /daté du.*?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})/i,
    /établi le.*?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})/i,
    /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/[-\.]/g, '/');
    }
  }

  // Si pas de date trouvée, retourner la date actuelle
  const now = new Date();
  return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
}

/**
 * Fonction principale
 */
async function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('🔍 Usage: node zkp-universelle.js <chemin_document> <requête>');
    console.log('📝 Exemple: node zkp-universelle.js documents/certificat.pdf "date de naissance"');
    return;
  }

  const documentPath = args[0];
  const query = args[1];
  const useAI = args[2] !== 'false'; // Troisième argument optionnel pour désactiver l'IA

  // Vérifier l'existence du document
  if (!fs.existsSync(documentPath)) {
    console.error(`❌ Le document ${documentPath} n'existe pas`);
    process.exit(1);
  }

  const result = await verifyDocument(documentPath, query, useAI);

  if (!result.success) {
    console.error(`❌ Échec de la vérification: ${result.error}`);
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});