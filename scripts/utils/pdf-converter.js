import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// Suppression de la dépendance canvas qui cause des problèmes
import { PDFDocument } from 'pdf-lib';

/**
 * Converts a PDF to images
 * @param {string} pdfPath - Path to the PDF
 * @param {string} outputDir - Output directory for images
 * @param {number} dpi - Image resolution (default 300)
 * @returns {Promise<string[]>} - Paths of generated images
 */
export async function convertPdfToImages(pdfPath, outputDir, dpi = 300) {
  console.log(`🔄 Conversion du PDF en images: ${pdfPath}`);

  try {
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Essayer d'utiliser pdftoppm si disponible (meilleure qualité)
    try {
      return await convertWithPdftoppm(pdfPath, outputDir, dpi);
    } catch (err) {
      console.log(`⚠️ pdftoppm non disponible, utilisation de méthode alternative: ${err.message}`);
      // Solution de contournement simplifiée - Retourner un tableau vide en cas d'échec
      console.warn('Conversion PDF vers images non disponible dans cet environnement');
      return [];
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion du PDF: ${error.message}`);
    return [];
  }
}

/**
 * Converts a PDF to images using pdftoppm (requires poppler-utils)
 * @param {string} pdfPath - Path to the PDF
 * @param {string} outputDir - Output directory
 * @param {number} dpi - Image resolution
 * @returns {Promise<string[]>} - Paths of generated images
 */
async function convertWithPdftoppm(pdfPath, outputDir, dpi) {
  const outputPrefix = path.join(outputDir, 'page');

  // Exécuter pdftoppm pour convertir le PDF en images PNG
  execSync(`pdftoppm -png -r ${dpi} "${pdfPath}" "${outputPrefix}"`);

  // Lister les fichiers générés
  const files = fs.readdirSync(outputDir)
    .filter(file => file.startsWith('page-') && file.endsWith('.png'))
    .map(file => path.join(outputDir, file))
    .sort(); // Trier par ordre de page

  console.log(`✅ PDF converti en ${files.length} images avec pdftoppm`);
  return files;
}

/**
 * Simplified fallback method when conversion is not available
 * @param {string} pdfPath - Path to the PDF
 * @param {string} outputDir - Output directory
 * @returns {Promise<string[]>} - Empty array
 */
async function convertWithSimpleFallback(pdfPath, outputDir) {
  console.warn('Méthode de conversion alternative non disponible dans cet environnement');
  return [];
}

/**
 * Cleans up temporary images after processing
 * @param {string[]} imagePaths - Paths of images to clean
 */
export function cleanupImages(imagePaths) {
  for (const imagePath of imagePaths) {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  console.log(`🧹 ${imagePaths.length} images temporaires nettoyées`);
}