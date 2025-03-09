import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

/**
 * Fonction pour encoder une image ou un PDF en base64
 * @param {string} filePath - Chemin du fichier à encoder
 * @returns {string} - Chaîne base64 du fichier
 */
function encodeFile(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Erreur lors de l'encodage du fichier: ${error}`);
    throw error;
  }
}

/**
 * Fonction principale qui utilise le SDK officiel Mistral
 */
async function main() {
  try {
    // Vérifier la clé API
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("Erreur: Clé API Mistral manquante dans le fichier .env");
      return;
    }

    // Chemin vers le PDF
    const pdfPath = path.resolve(process.cwd(), 'Attestation_hébergement.pdf');
    console.log(`Traitement du fichier: ${pdfPath}`);

    // Vérifier que le fichier existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Le fichier ${pdfPath} n'existe pas`);
      return;
    }

    // Encoder le PDF en base64
    console.log("Encodage du PDF en base64...");
    const base64PDF = encodeFile(pdfPath);
    console.log(`Taille du PDF encodé: ${base64PDF.length} caractères`);

    // Importer dynamiquement le module Mistral
    console.log("Importation du module @mistralai/mistralai...");
    const MistralModule = await import('@mistralai/mistralai');
    const MistralClient = MistralModule.default;

    if (!MistralClient) {
      console.error("Erreur: Impossible d'importer le client Mistral");
      return;
    }

    // Initialiser le client Mistral avec la clé API
    console.log("Initialisation du client Mistral...");
    const client = new MistralClient(apiKey);

    // Utiliser la méthode OCR pour traiter le document
    console.log("Envoi de la requête OCR via le client Mistral...");
    console.log("Cette opération peut prendre quelques instants...");

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${base64PDF}`
      },
      include_image_base64: false
    });

    console.log("Réponse reçue! Traitement des résultats...");

    // Vérifier la structure de la réponse
    if (ocrResponse.pages && ocrResponse.pages.length > 0) {
      console.log(`Nombre de pages traitées: ${ocrResponse.pages.length}`);

      // Afficher un extrait du texte extrait pour la première page
      const firstPage = ocrResponse.pages[0];
      const extractedText = firstPage.markdown || "Aucun texte extrait";
      const preview = extractedText.substring(0, 200) + "...";
      console.log(`Aperçu du texte extrait: ${preview}`);

      // Sauvegarder les résultats dans un fichier
      const outputPath = path.resolve(process.cwd(), 'ocr_result_sdk.json');
      fs.writeFileSync(outputPath, JSON.stringify(ocrResponse, null, 2));
      console.log(`Résultats complets sauvegardés dans ${outputPath}`);
    } else {
      console.log("Format de réponse inattendu ou aucune page extraite.");
    }
  } catch (error) {
    console.error("Erreur lors du traitement OCR:");
    if (error.response) {
      console.error(`Statut: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    console.error("Détails complets de l'erreur:", error);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error("Erreur non gérée:", error);
});