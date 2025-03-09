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
 * Fonction principale qui suit exactement l'exemple de la documentation
 */
async function main() {
  try {
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

    // Utiliser l'API OCR de Mistral exactement comme dans la documentation
    console.log("Envoi de la requête à l'API OCR de Mistral...");
    console.log("Cette opération peut prendre quelques instants...");

    // Format exact de la requête selon la documentation
    const response = await axios({
      method: 'post',
      url: 'https://api.mistral.ai/v1/ocr',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      data: {
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${base64PDF}`
        }
      },
      timeout: 120000 // 2 minutes
    });

    console.log("Réponse reçue! Traitement des résultats...");

    // Vérifier la structure de la réponse
    if (response.data && response.data.pages) {
      console.log(`Nombre de pages traitées: ${response.data.pages.length}`);

      // Afficher un extrait du texte extrait pour la première page
      if (response.data.pages.length > 0) {
        const firstPage = response.data.pages[0];
        const extractedText = firstPage.markdown || "Aucun texte extrait";
        const preview = extractedText.substring(0, 200) + "...";
        console.log(`Aperçu du texte extrait: ${preview}`);
      }

      // Sauvegarder les résultats dans un fichier
      const outputPath = path.resolve(process.cwd(), 'ocr_result_doc.json');
      fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
      console.log(`Résultats complets sauvegardés dans ${outputPath}`);
    } else {
      console.log("Format de réponse inattendu:", JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur
      console.error(`Erreur de l'API (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      // Aucune réponse reçue
      console.error("Aucune réponse reçue du serveur. Délai d'attente dépassé ou problème réseau.");
    } else {
      // Erreur lors de la création de la requête
      console.error("Erreur lors de la création de la requête:", error.message);
    }
    console.error("Détails techniques de l'erreur:", error);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error("Erreur non gérée:", error);
});