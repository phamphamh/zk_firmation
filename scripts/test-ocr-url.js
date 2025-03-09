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
 * Fonction principale pour tester l'OCR avec une URL externe
 */
async function main() {
  try {
    // Vérifier la clé API
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("Erreur: Clé API Mistral manquante dans le fichier .env");
      return;
    }

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

    // Utiliser un document PDF disponible en ligne
    // Exemple: un article scientifique sur arXiv
    const documentUrl = "https://arxiv.org/pdf/2201.04234";
    console.log(`Traitement du document en ligne: ${documentUrl}`);

    // Utiliser la méthode OCR pour traiter le document
    console.log("Envoi de la requête OCR via le client Mistral...");
    console.log("Cette opération peut prendre quelques instants...");

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: documentUrl
      }
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
      const outputPath = path.resolve(process.cwd(), 'ocr_result_url.json');
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