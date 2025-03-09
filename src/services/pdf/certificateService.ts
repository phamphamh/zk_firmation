import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AssertionValidation } from '../ai/aiJudgeService';
import { ZKPResult } from '../zkp/minaService';

// Types pour la génération de certificat
export interface CertificateData {
  contractFilename: string;
  extractionDate: Date;
  assertions: AssertionValidation[];
  zkpProofId?: string;
  aiJudgeName?: string;
  userSignature?: string;
}

export interface CertificateResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  error?: string;
}

/**
 * Service pour la génération de certificats PDF
 */
export class CertificateService {
  /**
   * Génère un certificat PDF à partir des données fournies
   */
  async generateCertificate(data: CertificateData): Promise<CertificateResult> {
    try {
      // Créer un nouveau document PDF
      const pdfDoc = await PDFDocument.create();

      // Ajouter une page au document
      const page = pdfDoc.addPage([595.28, 841.89]); // A4

      // Charger les polices standard
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Définir la taille de police et les marges
      const fontSize = 12;
      const margin = 50;
      const titleSize = 24;
      const subtitleSize = 18;

      // Ajouter le titre
      page.drawText('CERTIFICAT DE VÉRIFICATION', {
        x: page.getWidth() / 2 - (titleSize * 'CERTIFICAT DE VÉRIFICATION'.length) / 5,
        y: page.getHeight() - margin,
        size: titleSize,
        font: helveticaBold,
        color: rgb(0, 0, 0.8),
      });

      // Ajouter le sous-titre ZK-Firmation
      page.drawText('ZK-Firmation', {
        x: page.getWidth() / 2 - (subtitleSize * 'ZK-Firmation'.length) / 5,
        y: page.getHeight() - margin - titleSize - 20,
        size: subtitleSize,
        font: helveticaBold,
        color: rgb(0, 0.3, 0.6),
      });

      // Informations du document
      let yPos = page.getHeight() - margin - titleSize - subtitleSize - 60;

      page.drawText('INFORMATIONS DU DOCUMENT', {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 30;

      // Nom du fichier du contrat
      page.drawText(`Nom du document: ${data.contractFilename}`, {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;

      // Date d'extraction
      page.drawText(`Date de vérification: ${data.extractionDate.toLocaleString('fr-FR')}`, {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 40;

      // Résultats de vérification
      page.drawText('RÉSULTATS DE VÉRIFICATION', {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 30;

      // Affirmations validées
      page.drawText('Affirmations validées:', {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;

      // Liste des affirmations
      for (const assertion of data.assertions) {
        // Affirmation
        page.drawText(`• ${assertion.assertion}`, {
          x: margin + 10,
          y: yPos,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });

        yPos -= 20;

        // Résultat de validation
        const validationText = assertion.isValid ? 'VALIDE' : 'NON VALIDE';
        const validationColor = assertion.isValid ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0);

        page.drawText(`  Résultat: ${validationText} (Confiance: ${Math.round(assertion.confidence * 100)}%)`, {
          x: margin + 20,
          y: yPos,
          size: fontSize,
          font: helveticaBold,
          color: validationColor,
        });

        yPos -= 20;

        // Explication (limitée à 3 lignes)
        const explanationLines = this.splitTextIntoLines(assertion.explanation, 70);
        for (let i = 0; i < Math.min(3, explanationLines.length); i++) {
          page.drawText(`  ${explanationLines[i]}`, {
            x: margin + 20,
            y: yPos,
            size: fontSize - 2,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });

          yPos -= 15;
        }

        yPos -= 10;
      }

      // Informations ZKP
      yPos -= 20;

      page.drawText('PREUVE ZERO-KNOWLEDGE', {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 30;

      page.drawText(`ID de la preuve: ${data.zkpProofId || 'Non disponible'}`, {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Signatures
      yPos -= 60;

      page.drawText('SIGNATURES', {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPos -= 30;

      // Signature de l'AI Judge
      page.drawText(`AI Judge: ${data.aiJudgeName || 'Instance Intelligente de Vérification'}`, {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;

      // Signature de l'utilisateur
      page.drawText(`Utilisateur: ${data.userSignature || 'Non signé'}`, {
        x: margin,
        y: yPos,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Pied de page
      page.drawText('Ce certificat a été généré automatiquement par ZK-Firmation.', {
        x: margin,
        y: margin,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(`Généré le ${new Date().toLocaleString('fr-FR')}`, {
        x: margin,
        y: margin - 15,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Finaliser le PDF
      const pdfBytes = await pdfDoc.save();

      return {
        success: true,
        pdfBytes
      };
    } catch (error) {
      console.error('Erreur lors de la génération du certificat PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Divise un texte en lignes de longueur maximale
   */
  private splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine.length > 0 ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }
}