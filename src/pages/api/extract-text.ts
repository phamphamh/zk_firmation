import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { extractTextFromDocument } from '../../../scripts/utils/document-extractor';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Disable body parser to allow formidable to handle the request
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API route for text extraction from documents
 * @param req - HTTP request
 * @param res - HTTP response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée', success: false });
  }

  try {
    const form = formidable({
      multiples: false,
      uploadDir: os.tmpdir(),
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.document;
    if (!file || Array.isArray(file)) {
      return res.status(400).json({
        error: 'Aucun document fourni ou format invalide',
        success: false
      });
    }

    const filePath = file.filepath;
    console.log(`Extraction du texte depuis ${filePath}`);

    const language = fields.language ? String(fields.language) : 'fra+eng';

    try {
      const extractedText = await extractTextFromDocument(filePath, language);

      cleanupTempFile(filePath);

      return res.status(200).json({
        success: true,
        extractedText,
      });
    } catch (extractionError: any) {
      console.error('Erreur d\'extraction:', extractionError);

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      cleanupTempFile(filePath);

      return res.status(200).json({
        success: false,
        error: extractionError.message,
        fallbackText: fileContent,
      });
    }
  } catch (error: any) {
    console.error('Erreur de traitement:', error);
    return res.status(500).json({
      error: `Erreur lors de l'extraction: ${error.message}`,
      success: false
    });
  }
}

/**
 * Cleans up a temporary file
 * @param filePath - Path to the file to delete
 */
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Fichier temporaire supprimé: ${filePath}`);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier temporaire: ${error}`);
  }
}