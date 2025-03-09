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

// Import dynamique
async function runTest() {
  try {
    // Import dynamique du module Mistral
    const mistralModule = await import('@mistralai/mistralai');
    const MistralClient = mistralModule.default;

    console.log('Début du test OCR avec Mistral...');

    // Vérifier la présence de la clé API Mistral
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      throw new Error('La clé API Mistral est manquante. Veuillez la définir dans le fichier .env');
    }

    // Chemin absolu vers le PDF
    const pdfPath = path.resolve(process.cwd(), 'attestation_hébergement.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Le fichier ${pdfPath} n'existe pas`);
    }

    console.log('Fichier PDF trouvé:', pdfPath);

    // Fonction pour convertir un Buffer en base64
    function bufferToBase64(buffer) {
      return buffer.toString('base64');
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64Data = bufferToBase64(fileBuffer);

    // Initialiser le client Mistral
    const mistralClient = new MistralClient(mistralApiKey);

    // Effectuer l'extraction OCR
    console.log('Extraction du texte avec l\'API Mistral...');

    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrais tout le texte de ce document PDF. C'est une attestation d'hébergement. Identifie clairement les noms, dates et adresses."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`
              }
            }
          ]
        }
      ]
    });

    // Extraire le texte de la réponse
    const extractedText = response.choices[0].message.content;

    console.log('------- Texte extrait -------');
    console.log(extractedText);
    console.log('------- Fin du texte extrait -------');

    // Vérifier l'affirmation concernant l'hébergement
    console.log('\nVérification de l\'affirmation concernant l\'hébergement...');

    const responseAssertion = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Tu es un expert juridique chargé de vérifier si une affirmation concernant un document est vraie ou fausse. Réponds uniquement au format JSON avec les propriétés isValid (booléen), confidence (nombre entre 0 et 1), et explanation (explication de ta décision)."
        },
        {
          role: "user",
          content: `Document:\n\n${extractedText}\n\nAffirmation à vérifier: "Cette attestation confirme que la personne est hébergée à l'adresse mentionnée"`
        }
      ]
    });

    console.log('\nRésultat de l\'analyse:');
    console.log(responseAssertion.choices[0].message.content);

    // Simulation ZKP
    console.log('\nSimulation de la génération d\'une preuve ZKP...');

    setTimeout(() => {
      console.log('Preuve ZKP générée avec succès (simulation)');
      console.log('Hash du contrat: simulated-hash-' + Date.now());
      console.log('ID de transaction: mock-transaction-id-' + Date.now());

      console.log('\nTest OCR et ZKP terminé avec succès');
    }, 1000);
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécution du test
runTest().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});