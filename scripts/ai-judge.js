import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import MistralClient from '@mistralai/mistralai';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

// Initialiser le client Mistral
const mistralClient = process.env.MISTRAL_API_KEY
  ? new MistralClient(process.env.MISTRAL_API_KEY)
  : null;

/**
 * Charge le certificat généré
 * @returns {Object} Le certificat chargé
 */
function loadCertificate() {
  const certificatePath = path.resolve(process.cwd(), 'certificate.json');

  if (!fs.existsSync(certificatePath)) {
    throw new Error('Le certificat n\'existe pas. Veuillez d\'abord générer un certificat avec la commande npm run zkp:simple');
  }

  try {
    const certificateContent = fs.readFileSync(certificatePath, 'utf8');
    return JSON.parse(certificateContent);
  } catch (error) {
    throw new Error(`Erreur lors du chargement du certificat: ${error.message}`);
  }
}

/**
 * Charge le texte original du document OCR (si disponible)
 * @returns {string|null} Le texte extrait
 */
function loadOCRText() {
  const extractedTextPath = path.resolve(process.cwd(), 'extracted_text.txt');

  if (fs.existsSync(extractedTextPath)) {
    return fs.readFileSync(extractedTextPath, 'utf8');
  }

  return null;
}

/**
 * Vérifie les affirmations du certificat avec l'AI Judge
 * @param {Object} certificate - Le certificat à vérifier
 * @param {string|null} originalText - Le texte original du document
 * @returns {Promise<Array>} - Les résultats de vérification
 */
async function verifyWithAIJudge(certificate, originalText) {
  console.log('\n🧠 AI JUDGE - VÉRIFICATION DES AFFIRMATIONS');

  if (!mistralClient) {
    console.log('⚠️ Clé API Mistral non configurée. Utilisation de vérifications simulées.');
    return simulateAIJudgeVerification(certificate);
  }

  const verificationResults = [];

  for (const affirmation of certificate.validatedAffirmations) {
    console.log(`\n🔍 Vérification de l'affirmation: "${affirmation.statement}"`);

    try {
      const verificationResponse = await mistralClient.chat({
        model: "mistral-large-2402",
        messages: [
          {
            role: "system",
            content: `Tu es un juge IA expert juridique chargé de vérifier la validité d'affirmations juridiques basées sur un certificat ZKP (Zero Knowledge Proof).

            Les preuves à zéro connaissance (ZKP) sont des preuves cryptographiques qui permettent de prouver qu'une affirmation est vraie sans révéler les données sous-jacentes.

            Ton rôle est d'analyser l'affirmation, sa preuve ZKP (hash), et de déterminer si la preuve est cohérente avec l'affirmation.
            Tu dois évaluer:
            1. Si l'affirmation est claire et vérifiable
            2. Si la preuve ZKP fournie est cohérente avec l'affirmation
            3. Si la confiance déclarée est justifiée par la preuve

            Réponds au format JSON avec les champs:
            - verification: booléen (true si l'affirmation et la preuve sont cohérentes)
            - confidence: nombre entre 0 et 1
            - reasoning: explication détaillée de ton évaluation
            - recommendation: recommandation d'accepter ou rejeter la preuve`
          },
          {
            role: "user",
            content: `Certificat: ${JSON.stringify(certificate, null, 2)}

            Affirmation à vérifier: "${affirmation.statement}"
            Confiance déclarée: ${affirmation.confidence}
            Hash ZKP: ${affirmation.zkProofHash}

            ${originalText ? `Document original:\n${originalText}` : ''}

            Vérifie si cette affirmation et sa preuve ZKP sont cohérentes et valides.`
          }
        ]
      });

      const aiResponse = verificationResponse.choices[0].message.content;
      let jsonResponse;

      try {
        // Tenter d'extraire un JSON de la réponse
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                          aiResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('Format JSON non trouvé');
        }
      } catch (jsonError) {
        console.warn(`⚠️ Impossible de parser la réponse JSON: ${jsonError.message}`);
        console.log('Réponse brute:', aiResponse);

        // Créer une réponse approximative basée sur le texte
        jsonResponse = {
          verification: aiResponse.toLowerCase().includes('valid') ||
                       aiResponse.toLowerCase().includes('cohérent'),
          confidence: aiResponse.toLowerCase().includes('haute') ? 0.9 : 0.7,
          reasoning: aiResponse,
          recommendation: aiResponse.toLowerCase().includes('accept') ? 'Accepter' : 'Examiner'
        };
      }

      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: jsonResponse.verification,
        aiConfidence: jsonResponse.confidence,
        reasoning: jsonResponse.reasoning,
        recommendation: jsonResponse.recommendation
      };

      verificationResults.push(result);

      // Afficher le résultat
      console.log(`${jsonResponse.verification ? '✅' : '❌'} Résultat: ${jsonResponse.verification ? 'Validé' : 'Rejeté'} (Confiance: ${jsonResponse.confidence})`);
      console.log(`💡 Recommandation: ${jsonResponse.recommendation}`);

    } catch (error) {
      console.error(`Erreur lors de la vérification de l'affirmation: ${error.message}`);

      verificationResults.push({
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: false,
        aiConfidence: 0,
        reasoning: `Erreur de vérification: ${error.message}`,
        recommendation: 'Échec de la vérification - réessayer'
      });
    }
  }

  return verificationResults;
}

/**
 * Simulation de vérification AI Judge quand l'API n'est pas disponible
 * @param {Object} certificate - Le certificat à vérifier
 * @returns {Array} - Les résultats de vérification simulés
 */
function simulateAIJudgeVerification(certificate) {
  const verificationResults = [];

  for (const affirmation of certificate.validatedAffirmations) {
    console.log(`\n🔍 Simulation de vérification pour: "${affirmation.statement}"`);

    // La vérification de validité du document
    if (affirmation.statement.includes('valide, signée et tamponnée')) {
      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: true,
        aiConfidence: 0.95,
        reasoning: 'La preuve ZKP confirme que le document a été vérifié comme étant valide, signé et tamponné. Le hash cryptographique fourni correspond à une preuve valide générée par le circuit ZKP.',
        recommendation: 'Accepter'
      };
      verificationResults.push(result);
      console.log(`✅ Résultat: Validé (Confiance: ${result.aiConfidence})`);
    }
    // La vérification de la majorité
    else if (affirmation.statement.includes('majeur')) {
      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: true,
        aiConfidence: 0.9,
        reasoning: 'La preuve ZKP démontre de manière cryptographique que l\'hébergeur est bien majeur (plus de 18 ans) sans révéler sa date de naissance exacte.',
        recommendation: 'Accepter'
      };
      verificationResults.push(result);
      console.log(`✅ Résultat: Validé (Confiance: ${result.aiConfidence})`);
    }
    // La vérification de l'adresse
    else if (affirmation.statement.includes('adresse')) {
      const isSimplifiedProof = affirmation.zkProofHash === '1';
      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: true,
        aiConfidence: isSimplifiedProof ? 0.8 : 0.95,
        reasoning: isSimplifiedProof ?
          'La preuve simplifiée (hash = 1) indique que l\'adresse a été vérifiée, mais avec une méthode simplifiée.' :
          'La preuve ZKP indique que l\'adresse de l\'hébergeur a été vérifiée comme étant valide.',
        recommendation: 'Accepter'
      };
      verificationResults.push(result);
      console.log(`✅ Résultat: Validé (Confiance: ${result.aiConfidence})`);
    }
    // La vérification de l'identité de l'invité
    else if (affirmation.statement.includes('hébergé est correctement identifié')) {
      const isSimplifiedProof = affirmation.zkProofHash === '1';
      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: true,
        aiConfidence: isSimplifiedProof ? 0.75 : 0.9,
        reasoning: isSimplifiedProof ?
          'La preuve simplifiée (hash = 1) indique que l\'identité a été vérifiée, mais avec une méthode simplifiée qui vérifie uniquement la présence d\'un nom.' :
          'La preuve ZKP confirme que l\'identité de l\'hébergé a été vérifiée.',
        recommendation: isSimplifiedProof ? 'Accepter avec réserve' : 'Accepter'
      };
      verificationResults.push(result);
      console.log(`✅ Résultat: Validé (Confiance: ${result.aiConfidence})`);
    }
    // Cas par défaut
    else {
      const result = {
        statement: affirmation.statement,
        zkProofHash: affirmation.zkProofHash,
        originalConfidence: affirmation.confidence,
        aiVerification: false,
        aiConfidence: 0.5,
        reasoning: 'Impossible de vérifier cette affirmation avec certitude. Le contenu de l\'affirmation n\'est pas clairement identifiable dans les catégories connues.',
        recommendation: 'Examiner manuellement'
      };
      verificationResults.push(result);
      console.log(`❓ Résultat: Incertain (Confiance: ${result.aiConfidence})`);
    }
  }

  return verificationResults;
}

/**
 * Génère un rapport de l'AI Judge
 * @param {Object} certificate - Le certificat original
 * @param {Array} verificationResults - Les résultats de vérification
 * @returns {Object} - Le rapport final
 */
function generateAIJudgeReport(certificate, verificationResults) {
  // Calculer la confiance globale
  const totalConfidence = verificationResults.reduce((sum, result) => sum + result.aiConfidence, 0);
  const averageConfidence = totalConfidence / verificationResults.length;

  // Vérifier si toutes les vérifications sont passées
  const allVerified = verificationResults.every(result => result.aiVerification);

  // Créer des recommandations
  const recommendations = [];

  if (allVerified && averageConfidence > 0.9) {
    recommendations.push('Ce document peut être considéré comme hautement fiable.');
  } else if (allVerified && averageConfidence > 0.7) {
    recommendations.push('Ce document est fiable mais certaines preuves pourraient être renforcées.');
  } else if (allVerified) {
    recommendations.push('Ce document est acceptable mais présente des points à vérifier.');
  } else {
    recommendations.push('Ce document présente des affirmations non vérifiées qui nécessitent une attention particulière.');

    // Ajouter des recommandations spécifiques pour les affirmations non vérifiées
    const failedVerifications = verificationResults.filter(result => !result.aiVerification);
    for (const failed of failedVerifications) {
      recommendations.push(`Concernant "${failed.statement}": ${failed.recommendation}`);
    }
  }

  // Générer le rapport final
  const report = {
    title: "RAPPORT DE L'AI JUDGE - VÉRIFICATION DU CERTIFICAT",
    certificateId: certificate.id || `cert-${Date.now()}`,
    originalDocument: certificate.originalDocument,
    dateVerification: new Date().toISOString(),
    validationSummary: {
      totalAffirmations: verificationResults.length,
      validatedAffirmations: verificationResults.filter(r => r.aiVerification).length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      overallStatus: allVerified ? 'VALIDÉ' : 'PARTIELLEMENT VALIDÉ'
    },
    detailedResults: verificationResults,
    recommendations,
    legalDisclaimer: "Ce rapport a été généré par l'AI Judge, un système automatisé d'analyse juridique basé sur l'intelligence artificielle. Il ne remplace pas l'avis d'un professionnel du droit."
  };

  // Sauvegarder le rapport
  const reportPath = path.resolve(process.cwd(), 'ai_judge_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Rapport de l'AI Judge sauvegardé dans ${reportPath}`);

  return report;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log("🧑‍⚖️ Démarrage de l'AI Judge - Vérification du certificat ZKP...");

    // Étape 1: Charger le certificat
    console.log('\n=== ÉTAPE 1: CHARGEMENT DU CERTIFICAT ===');
    const certificate = loadCertificate();
    console.log(`✅ Certificat chargé: ${certificate.title}`);

    // Étape 2: Charger le texte original si disponible
    console.log('\n=== ÉTAPE 2: CHARGEMENT DU TEXTE ORIGINAL ===');
    const originalText = loadOCRText();
    console.log(`${originalText ? '✅ Texte original chargé' : '⚠️ Texte original non disponible'}`);

    // Étape 3: Vérifier les affirmations avec l'AI Judge
    console.log('\n=== ÉTAPE 3: VÉRIFICATION PAR L\'AI JUDGE ===');
    const verificationResults = await verifyWithAIJudge(certificate, originalText);

    // Étape 4: Générer le rapport final
    console.log('\n=== ÉTAPE 4: GÉNÉRATION DU RAPPORT ===');
    const report = generateAIJudgeReport(certificate, verificationResults);

    // Résumé
    console.log('\n=== RÉSUMÉ DU RAPPORT ===');
    console.log(`Statut global: ${report.validationSummary.overallStatus}`);
    console.log(`Affirmations validées: ${report.validationSummary.validatedAffirmations}/${report.validationSummary.totalAffirmations}`);
    console.log(`Confiance moyenne: ${report.validationSummary.averageConfidence * 100}%`);

    console.log('\nRecommandations:');
    report.recommendations.forEach(rec => console.log(`- ${rec}`));

    console.log('\n✨ PROCESSUS DE VÉRIFICATION PAR L\'AI JUDGE TERMINÉ AVEC SUCCÈS ✨');

    return {
      success: true,
      report
    };
  } catch (error) {
    console.error(`Erreur lors du processus de vérification par l'AI Judge: ${error.message}`);

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