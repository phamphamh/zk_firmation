/**
 * Document extraction service for client-side environment
 * Compatible with Next.js
 */

/**
 * Sends a document to the server for text extraction
 * @param document - Document file to process
 * @param language - Document language (optional)
 * @returns Extracted text
 */
export async function extractTextFromDocument(document: File, language: string = 'fra+eng'): Promise<string> {
  console.log(`📄 Envoi du document pour extraction: ${document.name}`);

  try {
    // Créer un FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('document', document);
    formData.append('language', language);

    // Envoyer le fichier à l'API d'extraction
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'extraction du texte");
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Extraction de texte réussie');
      return result.extractedText;
    } else if (result.fallbackText) {
      console.warn('⚠️ Extraction OCR échouée, utilisation du texte brut');
      return result.fallbackText;
    } else {
      throw new Error(result.error || "Échec de l'extraction de texte");
    }
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'extraction: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts specific information from text via API
 * @param text - Text to analyze
 * @param query - Extraction query
 * @param useAI - Whether to use AI for extraction
 * @returns Extracted information
 */
export async function extractInfoFromText(text: string, query: string, useAI: boolean = true): Promise<any> {
  console.log(`🔍 Extraction d'informations: "${query}"`);

  try {
    // Appeler l'API d'extraction d'informations
    const response = await fetch('/api/extract-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        query,
        useAI
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'extraction d'informations");
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Extraction d\'informations réussie');
      return result.result;
    } else {
      throw new Error(result.error || "Échec de l'extraction d'informations");
    }
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'extraction d'informations: ${error.message}`);
    throw error;
  }
}

/**
 * Reads a file as text (fallback for text files)
 * @param file - File to read
 * @returns File content
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}