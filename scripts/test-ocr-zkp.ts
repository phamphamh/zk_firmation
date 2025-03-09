import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Field } from 'o1js';

// Charger les variables d'environnement
dotenv.config();

// Type OCRResult
interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

// Type AssertionValidation
interface AssertionValidation {
  assertion: string;
  isValid: boolean;
  confidence: number;
  explanation: string;
}

// Fonction pour convertir un Buffer en base64
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// Fonction pour extraire le texte avec l'API Mistral
async function extractTextWithMistral(pdfPath: string, apiKey: string): Promise<OCRResult> {
  try {
    console.log(`Extraction OCR pour ${pdfPath} avec l'API Mistral...`);

    // Lire le fichier
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64Data = bufferToBase64(fileBuffer);

    // Import dynamique du module Mistral
    const { MistralClient } = await import('@mistralai/mistralai');

    // Initialiser le client Mistral
    const mistralClient = new MistralClient(apiKey);

    // Appeler l'API pour extraire le texte
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

    console.log("Extraction OCR réussie");
    return {
      text: extractedText,
      confidence: 0.9, // Mistral ne donne pas de score de confiance, donc on utilise une valeur par défaut
      success: true
    };
  } catch (error: any) {
    console.error("Erreur lors de l'extraction OCR:", error);
    return {
      text: "",
      confidence: 0,
      success: false,
      error: error.message || "Erreur inconnue"
    };
  }
}

// Fonction pour vérifier une affirmation avec l'API Mistral
async function verifyAssertionWithMistral(extractedText: string, assertion: string, apiKey: string): Promise<AssertionValidation> {
  try {
    console.log(`Vérification de l'affirmation avec l'API Mistral: "${assertion}"`);

    // Import dynamique du module Mistral
    const { MistralClient } = await import('@mistralai/mistralai');

    // Initialiser le client Mistral
    const mistralClient = new MistralClient(apiKey);

    // Appeler l'API pour vérifier l'affirmation
    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Tu es un expert juridique chargé de vérifier si une affirmation concernant un contrat est vraie ou fausse. Analyse le texte du document fourni et détermine si l'affirmation est valide. Réponds au format JSON avec les propriétés isValid (booléen), confidence (nombre entre 0 et 1), et explanation (texte explicatif détaillant ton raisonnement)."
        },
        {
          role: "user",
          content: `Document:\n\n${extractedText}\n\nAffirmation à vérifier: "${assertion}"`
        }
      ]
    });

    // Extraire la réponse de l'AI
    const content = response.choices[0].message.content;

    // Tenter de parser la réponse JSON
    try {
      // Si le modèle a correctement fourni une réponse au format JSON
      const jsonResponse = JSON.parse(content);
      return {
        assertion,
        isValid: jsonResponse.isValid,
        confidence: jsonResponse.confidence,
        explanation: jsonResponse.explanation
      };
    } catch (jsonError) {
      // Si la réponse n'est pas au format JSON, analyser le texte pour en extraire l'information
      const isValid = content.toLowerCase().includes("vrai") ||
                    content.toLowerCase().includes("valide") &&
                    !content.toLowerCase().includes("faux") &&
                    !content.toLowerCase().includes("non valide");

      return {
        assertion,
        isValid,
        confidence: 0.7, // Confiance réduite car on a dû interpréter la réponse
        explanation: content
      };
    }
  } catch (error: any) {
    console.error("Erreur lors de la vérification de l'affirmation:", error);
    return {
      assertion,
      isValid: false,
      confidence: 0,
      explanation: error.message || "Erreur inconnue"
    };
  }
}

// Fonction pour simuler la génération d'une preuve ZKP
function simulateZKP(text: string, assertion: string): Promise<any> {
  return new Promise((resolve) => {
    console.log(`Simulation de génération de preuve ZKP pour l'affirmation: "${assertion}"`);

    setTimeout(() => {
      resolve({
        success: true,
        proof: {
          publicInput: { toString: () => "simulated-hash-" + Date.now() },
          assertion,
          type: 'mock-assertion-proof'
        }
      });
    }, 500);
  });
}

// Fonction pour simuler la soumission d'une preuve à la blockchain
function simulateBlockchainSubmission(proof: any): Promise<any> {
  return new Promise((resolve) => {
    console.log('Simulation de soumission de preuve à la blockchain...');

    setTimeout(() => {
      resolve({
        success: true,
        proof: { txId: 'mock-transaction-id-' + Date.now() }
      });
    }, 500);
  });
}

// Fonction principale
async function main() {
  try {
    console.log('Début du test OCR et ZKP...');

    // Vérifier la présence de la clé API Mistral
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      throw new Error('La clé API Mistral est manquante. Veuillez la définir dans le fichier .env');
    }

    // Charger le fichier PDF
    const pdfPath = path.join(process.cwd(), 'attestation_hébergement.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Le fichier ${pdfPath} n'existe pas`);
    }

    console.log('Fichier PDF trouvé:', pdfPath);

    // Extraire le texte avec l'API Mistral
    console.log('Extraction du texte avec l\'API Mistral...');
    const ocrResult = await extractTextWithMistral(pdfPath, mistralApiKey);

    if (!ocrResult.success) {
      throw new Error(`Échec de l'extraction OCR: ${ocrResult.error}`);
    }

    console.log('Texte extrait avec succès (confiance:', ocrResult.confidence, ')');
    console.log('------- Début du texte extrait -------');
    console.log(ocrResult.text.substring(0, 500) + '...');
    console.log('------- Fin du texte extrait -------');

    // Vérifier les affirmations avec l'API Mistral
    console.log('Vérification des affirmations avec l\'API Mistral...');

    // Vérifier l'affirmation sur l'hébergement
    console.log('Vérification de l\'affirmation concernant l\'hébergement...');
    const affirmationConcernantHebergement = await verifyAssertionWithMistral(
      ocrResult.text,
      "Cette attestation confirme que la personne est hébergée à l'adresse mentionnée",
      mistralApiKey
    );

    console.log('Affirmation sur l\'hébergement:',
      affirmationConcernantHebergement.isValid ? 'VALIDE' : 'NON VALIDE',
      `(confiance: ${affirmationConcernantHebergement.confidence})`
    );
    console.log('Explication:', affirmationConcernantHebergement.explanation);

    // Vérifier l'affirmation sur la majorité
    console.log('Vérification de l\'information sur la majorité...');
    const affirmationMajorite = await verifyAssertionWithMistral(
      ocrResult.text,
      "La personne mentionnée dans ce document est majeure (a plus de 18 ans)",
      mistralApiKey
    );

    console.log('Affirmation sur la majorité:',
      affirmationMajorite.isValid ? 'VALIDE' : 'NON VALIDE',
      `(confiance: ${affirmationMajorite.confidence})`
    );
    console.log('Explication:', affirmationMajorite.explanation);

    // Vérifier la nationalité française basée sur l'adresse
    console.log('Vérification de la nationalité française basée sur l\'adresse...');
    const affirmationFrancaise = await verifyAssertionWithMistral(
      ocrResult.text,
      "L'adresse mentionnée dans ce document est située en France",
      mistralApiKey
    );

    console.log('Affirmation sur la nationalité:',
      affirmationFrancaise.isValid ? 'VALIDE' : 'NON VALIDE',
      `(confiance: ${affirmationFrancaise.confidence})`
    );
    console.log('Explication:', affirmationFrancaise.explanation);

    // Extraire l'affirmation d'hébergement pour la preuve ZKP
    const affirmationHebergement = "La personne est hébergée à l'adresse mentionnée dans le document";

    // Générer une preuve pour l'affirmation sur l'hébergement
    console.log('Génération de la preuve ZKP pour l\'affirmation sur l\'hébergement...');
    const zkpResult = await simulateZKP(ocrResult.text, affirmationHebergement);

    if (zkpResult.success) {
      console.log('Preuve ZKP générée avec succès:');
      console.log('Type de preuve:', zkpResult.proof?.type);
      console.log('Hash du contrat:', zkpResult.proof?.publicInput.toString());
      console.log('Affirmation:', zkpResult.proof?.assertion);

      // Soumettre la preuve à la blockchain
      console.log('Soumission de la preuve à la blockchain...');
      const submissionResult = await simulateBlockchainSubmission(zkpResult.proof);

      if (submissionResult.success) {
        console.log('Preuve soumise avec succès:');
        console.log('ID de transaction:', submissionResult.proof?.txId);
      } else {
        console.error('Échec de la soumission de la preuve:', submissionResult.error);
      }
    } else {
      console.error('Échec de la génération de la preuve ZKP:', zkpResult.error);
    }

    console.log('Test OCR et ZKP terminé avec succès');
  } catch (error: any) {
    console.error('Erreur lors du test OCR et ZKP:', error);
  }
}

// Exécution de la fonction principale
main().catch((error: any) => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});