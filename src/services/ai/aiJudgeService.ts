import { MistralClient } from '@mistralai/mistralai';
import { DocumentElement } from '../ocr/mistralOCR';

// Types pour les résultats de vérification AI
export interface AIVerificationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  success: boolean;
  error?: string;
}

export interface AssertionValidation {
  assertion: string;
  isValid: boolean;
  confidence: number;
  explanation: string;
}

/**
 * Service pour la vérification intelligente (AI Judge)
 */
export class AIJudgeService {
  private client: MistralClient;

  constructor(apiKey: string) {
    this.client = new MistralClient(apiKey);
  }

  /**
   * Vérifie la validité d'un contrat basé sur l'extraction OCR
   */
  async verifyContract(extractedText: string): Promise<AIVerificationResult> {
    try {
      // Appel à l'API Mistral pour analyser le contrat
      const response = await this.client.chat({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "Tu es un expert juridique chargé de vérifier la validité des contrats. Tu dois analyser le texte du contrat fourni et déterminer s'il contient tous les éléments nécessaires pour être valide (parties identifiées, objet du contrat clair, signatures présentes, etc.). Réponds au format JSON avec les propriétés isValid (booléen), confidence (nombre entre 0 et 1), et reason (texte explicatif)."
          },
          {
            role: "user",
            content: `Analyse ce contrat et vérifie sa validité:\n\n${extractedText}`
          }
        ]
      });

      // Extraire la réponse JSON de l'AI
      const content = response.choices[0].message.content;

      // Tenter de parser la réponse JSON
      try {
        // Si le modèle a correctement fourni une réponse au format JSON
        const jsonResponse = JSON.parse(content);
        return {
          isValid: jsonResponse.isValid,
          confidence: jsonResponse.confidence,
          reason: jsonResponse.reason,
          success: true
        };
      } catch (jsonError) {
        // Si la réponse n'est pas au format JSON, analyser le texte pour en extraire l'information
        // Cette partie est une solution de secours si le modèle ne répond pas correctement au format JSON
        const isValid = content.toLowerCase().includes("valide") && !content.toLowerCase().includes("non valide");
        return {
          isValid,
          confidence: 0.7, // Confiance réduite car on a dû interpréter la réponse
          reason: content,
          success: true
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du contrat par l\'AI:', error);
      return {
        isValid: false,
        confidence: 0,
        reason: 'Erreur lors de l\'analyse',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifie la validité d'une affirmation spécifique sur le contrat
   */
  async verifyAssertion(extractedText: string, assertion: string): Promise<AssertionValidation> {
    try {
      // Appel à l'API Mistral pour vérifier l'affirmation
      const response = await this.client.chat({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "Tu es un expert juridique chargé de vérifier si une affirmation concernant un contrat est vraie ou fausse. Analyse le texte du contrat fourni et détermine si l'affirmation est valide. Réponds au format JSON avec les propriétés isValid (booléen), confidence (nombre entre 0 et 1), et explanation (texte explicatif détaillant ton raisonnement)."
          },
          {
            role: "user",
            content: `Contrat:\n\n${extractedText}\n\nAffirmation à vérifier: "${assertion}"`
          }
        ]
      });

      // Extraire la réponse JSON de l'AI
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
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'affirmation par l\'AI:', error);
      return {
        assertion,
        isValid: false,
        confidence: 0,
        explanation: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifie les éléments spécifiques d'un contrat (signatures, tampons, etc.)
   */
  async verifyDocumentElements(elements: DocumentElement[]): Promise<AIVerificationResult> {
    try {
      // Convertir les éléments en format texte pour l'API
      const elementsText = elements.map(el =>
        `Type: ${el.type}, Contenu: ${el.content}, Confiance: ${el.confidence}`
      ).join('\n');

      // Appel à l'API Mistral pour vérifier les éléments
      const response = await this.client.chat({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "Tu es un expert juridique chargé de vérifier la validité des éléments d'un contrat (signatures, tampons, etc.). Analyse les éléments fournis et détermine si le contrat semble valide sur cette base. Réponds au format JSON avec les propriétés isValid (booléen), confidence (nombre entre 0 et 1), et reason (texte explicatif)."
          },
          {
            role: "user",
            content: `Éléments du contrat:\n\n${elementsText}`
          }
        ]
      });

      // Traitement similaire à la méthode verifyContract
      const content = response.choices[0].message.content;

      try {
        const jsonResponse = JSON.parse(content);
        return {
          isValid: jsonResponse.isValid,
          confidence: jsonResponse.confidence,
          reason: jsonResponse.reason,
          success: true
        };
      } catch (jsonError) {
        const isValid = content.toLowerCase().includes("valide") && !content.toLowerCase().includes("non valide");
        return {
          isValid,
          confidence: 0.7,
          reason: content,
          success: true
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des éléments du document par l\'AI:', error);
      return {
        isValid: false,
        confidence: 0,
        reason: 'Erreur lors de l\'analyse des éléments',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}