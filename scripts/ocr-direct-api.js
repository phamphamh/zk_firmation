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

    // Utiliser une image simple disponible en ligne
    const documentUrl = "https://i.imgur.com/P2W5O8g.png";
    console.log(`Traitement de l'image en ligne: ${documentUrl}`);

    // Faire la requête OCR en suivant exactement le format de l'exemple curl
    console.log("Envoi de la requête à l'API OCR de Mistral...");
    console.log("Cette opération peut prendre quelques instants...");

    const response = await axios({
      method: 'post',
      url: 'https://api.mistral.ai/v1/ocr',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: "mistral-ocr-latest",
        document: {
          type: "image_url",
          image_url: documentUrl
        }
      },
      timeout: 30000 // 30 secondes
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
      const outputPath = path.resolve(process.cwd(), 'ocr_result_direct.json');
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