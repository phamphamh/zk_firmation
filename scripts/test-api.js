import dotenv from 'dotenv';
import axios from 'axios';

// Charger les variables d'environnement
dotenv.config();

async function testMistralAPI() {
  console.log("Test d'accès à l'API Mistral...");
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    console.error("Erreur: Clé API Mistral manquante dans le fichier .env");
    return;
  }

  console.log(`Clé API trouvée: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`);

  try {
    // Faire une requête simple à l'API Mistral pour obtenir les modèles disponibles
    const response = await axios.get('https://api.mistral.ai/v1/models', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log("Réponse reçue de l'API Mistral:");
    console.log(JSON.stringify(response.data, null, 2));

    // Vérifier si le modèle OCR est disponible
    const ocrModel = response.data.data.find(model => model.id.includes('ocr'));
    if (ocrModel) {
      console.log(`\nModèle OCR trouvé: ${ocrModel.id}`);
    } else {
      console.log("\nAucun modèle OCR trouvé dans la liste des modèles disponibles.");
    }

  } catch (error) {
    console.error("Erreur lors de l'accès à l'API Mistral:");
    if (error.response) {
      console.error(`Statut: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
  }
}

// Exécuter le test
testMistralAPI().catch(error => {
  console.error("Erreur non gérée:", error);
});