import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createWorker } from 'tesseract.js';
import { convertPdfToImages, cleanupImages } from './pdf-converter.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Converts an image to text using OCR
 * @param {string} imagePath - Path to the image
 * @param {string} language - Document language (fra, eng, etc.)
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImage(imagePath, language = 'fra+eng') {
  console.log(`🔍 Extraction du texte de l'image: ${imagePath}`);

  try {
    const worker = await createWorker(language);
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();

    console.log('✅ Extraction OCR réussie');
    return text;
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction OCR: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts text from a PDF by converting it to images and applying OCR
 * @param {string} pdfPath - Path to the PDF
 * @param {string} language - Document language (fra, eng, etc.)
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(pdfPath, language = 'fra+eng') {
  console.log(`🔍 Extraction du texte du PDF: ${pdfPath}`);

  try {
    const tempDir = path.resolve(process.cwd(), 'temp_images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const imagePaths = await convertPdfToImages(pdfPath, tempDir);

    if (imagePaths.length === 0) {
      console.warn('Aucune image générée à partir du PDF, tentative de lecture directe du contenu');
      try {
        const pdfContent = fs.readFileSync(pdfPath, 'utf-8');
        return `CONTENU BRUT DU PDF:\n\n${pdfContent}`;
      } catch (readError) {
        throw new Error('Impossible de traiter le PDF - conversion en image et lecture directe ont échoué');
      }
    }

    const textPromises = imagePaths.map(imgPath => extractTextFromImage(imgPath, language));
    const textResults = await Promise.all(textPromises);
    const fullText = textResults.join('\n\n');

    cleanupImages(imagePaths);

    console.log('✅ Extraction du texte PDF réussie');
    return fullText;
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction du PDF: ${error.message}`);

    try {
      console.log('Tentative de lecture directe du PDF comme texte');
      const pdfContent = fs.readFileSync(pdfPath, 'utf-8');
      return `ÉCHEC OCR - CONTENU BRUT DU PDF:\n\n${pdfContent}`;
    } catch (readError) {
      throw error;
    }
  }
}

/**
 * Extracts text from a document (PDF, image, or text file)
 * @param {string} documentPath - Path to the document
 * @param {string} language - Document language for OCR
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDocument(documentPath, language = 'fra+eng') {
  console.log(`📄 Extraction du texte depuis: ${documentPath}`);

  const extension = path.extname(documentPath).toLowerCase();

  try {
    if (extension === '.pdf') {
      return await extractTextFromPDF(documentPath, language);
    } else if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'].includes(extension)) {
      return await extractTextFromImage(documentPath, language);
    } else if (['.txt', '.text', '.md', '.html', '.htm', '.xml'].includes(extension)) {
      const content = fs.readFileSync(documentPath, 'utf-8');
      return content;
    } else {
      throw new Error(`Format de fichier non supporté: ${extension}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction: ${error.message}`);
    throw error;
  }
}

/**
 * Saves extracted text to a file
 * @param {string} text - Text to save
 * @param {string} documentPath - Path to the original document
 * @returns {string} - Path to the saved file
 */
export function saveExtractedText(text, documentPath) {
  const baseName = path.basename(documentPath, path.extname(documentPath));
  const outputPath = path.resolve(process.cwd(), `${baseName}_extracted.txt`);

  fs.writeFileSync(outputPath, text);
  console.log(`💾 Texte extrait sauvegardé dans: ${outputPath}`);

  return outputPath;
}

/**
 * Main function for text extraction and saving
 * @param {string} documentPath - Path to the document
 * @param {string} language - Document language
 * @returns {Promise<{text: string, outputPath: string}>} - Extracted text and save path
 */
export async function extractAndSaveText(documentPath, language = 'fra+eng') {
  try {
    const text = await extractTextFromDocument(documentPath, language);
    const outputPath = saveExtractedText(text, documentPath);

    return {
      text,
      outputPath
    };
  } catch (error) {
    console.error(`❌ Erreur globale d'extraction: ${error.message}`);
    throw error;
  }
}