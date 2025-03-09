import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

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

    console.log(`Taille du PDF en base64: ${pdfBase64.length} caractères`);
    console.log("Envoi de la requête à l'API OCR de Mistral...");
    console.log("Cette opération peut prendre plusieurs minutes pour les documents volumineux...");

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
        },
        timeout: 300000 // 5 minutes de délai d'attente
      }
    );

    console.log("Réponse reçue de l'API OCR.");
    return response.data;
  } catch (error) {
    console.error(`Erreur de l'API (${error.response?.status || 'inconnu'}): ${JSON.stringify(error.response?.data || {})}`);
    console.error(`Message d'erreur complet: ${error.message}`);
    throw new Error(`Erreur lors du traitement: ${error}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    const pdfPath = path.resolve(process.cwd(), 'Attestation_hébergement.pdf');

    // Extraire le texte avec l'API OCR de Mistral
    const ocrResult = await extractTextWithMistralOCR(pdfPath);

    // Afficher les résultats
    console.log('\n--- RÉSULTATS DE L\'OCR ---');

    if (ocrResult.pages && ocrResult.pages.length > 0) {
      // Parcourir chaque page et afficher le markdown extrait
      ocrResult.pages.forEach((page, index) => {
        console.log(`\n----- PAGE ${index + 1} -----`);
        console.log(page.markdown);
      });

      // Informations d'utilisation
      console.log('\n--- INFORMATIONS D\'UTILISATION ---');
      console.log(`Pages traitées: ${ocrResult.usage_info.pages_processed}`);
      console.log(`Taille du document: ${ocrResult.usage_info.doc_size_bytes} octets`);
    } else {
      console.log('Aucune page extraite dans la réponse.');
    }

    // Sauvegarder les résultats dans un fichier
    const outputPath = path.resolve(process.cwd(), 'ocr_result.json');
    fs.writeFileSync(outputPath, JSON.stringify(ocrResult, null, 2));
    console.log(`\nRésultats sauvegardés dans ${outputPath}`);

    return ocrResult;
  } catch (error) {
    console.error('Erreur lors du traitement:', error);
    return null;
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});