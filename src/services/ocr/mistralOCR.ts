import { MistralClient } from '@mistralai/mistralai';

// Types pour les résultats d'extraction OCR
export interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export interface DocumentElement {
  type: 'signature' | 'stamp' | 'text' | 'date';
  content: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Service pour l'extraction OCR avec Mistral
 */
export class MistralOCRService {
  private client: MistralClient;

  constructor(apiKey: string) {
    this.client = new MistralClient(apiKey);
  }

  /**
   * Convertit une image en base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Enlever le préfixe "data:image/jpeg;base64," pour obtenir uniquement la chaîne base64
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Extrait le texte d'un document
   */
  async extractText(file: File): Promise<OCRResult> {
    try {
      const base64Image = await this.fileToBase64(file);

      // Utilisation de l'API Mistral pour l'extraction OCR
      // Note: Ce code est simulé car l'API exacte de Mistral pour l'OCR
      // pourrait être différente. Consultez la documentation officielle.
      const response = await this.client.chat({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrais tout le texte de cette image, y compris les signatures, les tampons, et les dates. Identifie séparément ces éléments."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      });

      // Traiter la réponse de l'API
      const extractedText = response.choices[0].message.content;

      // Dans un cas réel, vous auriez besoin d'analyser la réponse
      // pour extraire les différents éléments (texte, signatures, etc.)
      return {
        text: extractedText,
        confidence: 0.85, // Simulé
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de l\'extraction OCR:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Identifie les éléments spécifiques dans un document (signatures, tampons, etc.)
   * Cette fonction est une simulation et devrait être adaptée selon les capacités réelles de l'API
   */
  async identifyDocumentElements(file: File): Promise<DocumentElement[]> {
    try {
      const result = await this.extractText(file);

      if (!result.success) {
        throw new Error(result.error || 'Échec de l\'extraction OCR');
      }

      // Cette partie est simulée
      // Dans un cas réel, vous analyseriez la réponse de l'API pour identifier
      // les différents éléments du document
      const elements: DocumentElement[] = [
        {
          type: 'text',
          content: result.text,
          confidence: result.confidence
        }
        // Dans une implémentation réelle, vous auriez également des signatures, tampons, etc.
      ];

      return elements;
    } catch (error) {
      console.error('Erreur lors de l\'identification des éléments du document:', error);
      return [];
    }
  }
}