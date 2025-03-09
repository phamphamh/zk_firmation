import { NextApiRequest, NextApiResponse } from 'next';
import { InfoExtractor } from '../../../scripts/utils/info-extractor';

/**
 * API route for extracting specific information from text
 * @param req - HTTP request
 * @param res - HTTP response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée', success: false });
  }

  try {
    const { text, query, useAI } = req.body;

    if (!text || !query) {
      return res.status(400).json({
        error: 'Paramètres manquants: text et query sont requis',
        success: false
      });
    }

    const extractor = new InfoExtractor(useAI === undefined ? true : useAI);

    const result = await extractor.extractInfo(text, query);

    return res.status(200).json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Erreur d\'extraction d\'informations:', error);
    return res.status(500).json({
      error: `Erreur lors de l'extraction d'informations: ${error.message}`,
      success: false
    });
  }
}