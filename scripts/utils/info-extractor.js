import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// Charger les variables d'environnement
dotenv.config();

/**
 * Classe d'extraction d'informations à partir de texte
 */
export class InfoExtractor {
  constructor(useAI = true) {
    this.useAI = useAI && process.env.MISTRAL_API_KEY;
  }

  /**
   * Extrait des informations spécifiques du texte selon la demande
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction (ex: "date d'expiration", "nom complet", etc.)
   * @returns {Promise<Object>} - Données extraites
   */
  async extractInfo(text, query) {
    console.log(`🧠 Extraction d'information: "${query}"`);

    try {
      if (this.useAI) {
        return await this.extractWithAI(text, query);
      } else {
        return await this.extractWithRegex(text, query);
      }
    } catch (error) {
      console.error(`❌ Erreur d'extraction: ${error.message}`);
      // Fallback sur la méthode regex en cas d'échec de l'IA
      if (this.useAI) {
        console.log('⚠️ Fallback sur la méthode regex');
        return await this.extractWithRegex(text, query);
      }
      throw error;
    }
  }

  /**
   * Extrait des informations avec l'API Mistral AI
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Promise<Object>} - Données extraites
   */
  async extractWithAI(text, query) {
    console.log('🤖 Utilisation de l\'IA pour l\'extraction');

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: "mistral-large-latest",
          messages: [
            {
              role: "system",
              content: `Tu es un assistant spécialisé dans l'extraction précise d'informations à partir de documents.
              Ton objectif est d'extraire UNIQUEMENT les informations demandées, sans ajouter d'interprétation.
              Réponds UNIQUEMENT au format JSON avec les propriétés:
              - "found": boolean indiquant si l'information a été trouvée
              - "value": valeur extraite, ou null si non trouvée
              - "confidence": niveau de confiance entre 0 et 1
              - "context": le contexte autour de l'information (quelques mots avant/après)`
            },
            {
              role: "user",
              content: `Extrait l'information suivante du texte: "${query}"\n\nTexte du document:\n${text.substring(0, 8000)}`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
          }
        }
      );

      const result = response.data.choices[0].message.content;

      // Tenter de parser le JSON de la réponse
      try {
        let jsonMatch;
        if (result.includes('```json')) {
          jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
          }
        }

        // Essayer de parser directement
        const jsonData = JSON.parse(result);
        return jsonData;
      } catch (parseError) {
        console.error(`❌ Erreur de parsing JSON: ${parseError.message}`);
        console.log('Réponse brute:', result);

        // Créer un objet de résultat basique
        return {
          found: result.toLowerCase().includes('trouvé') ||
                !result.toLowerCase().includes('non trouvé'),
          value: this.extractValueFromText(result),
          confidence: 0.5,
          context: result
        };
      }
    } catch (error) {
      console.error(`❌ Erreur API IA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrait une valeur du texte de réponse quand le parsing JSON échoue
   * @param {string} text - Texte de réponse
   * @returns {string|null} - Valeur extraite ou null
   */
  extractValueFromText(text) {
    // Recherche des patterns comme "value: X" ou "valeur: X" ou "extrait: X"
    const valueMatch = text.match(/(?:value|valeur|extrait|résultat)\s*:?\s*['"](.*?)['"]|(?:value|valeur|extrait|résultat)\s*:?\s*([\w\d\s\-\/\.]+)/i);
    if (valueMatch) {
      return (valueMatch[1] || valueMatch[2]).trim();
    }
    return null;
  }

  /**
   * Extrait des informations avec des regex selon le type de demande
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Promise<Object>} - Données extraites
   */
  async extractWithRegex(text, query) {
    console.log('🔍 Utilisation de regex pour l\'extraction');

    const normalizedQuery = query.toLowerCase();
    let result = { found: false, value: null, confidence: 0, context: null };

    // Détection du type d'information demandée
    if (normalizedQuery.includes('date') || normalizedQuery.includes('expiration')) {
      result = this.extractDate(text, normalizedQuery);
    } else if (normalizedQuery.includes('nom') || normalizedQuery.includes('personne')) {
      result = this.extractName(text, normalizedQuery);
    } else if (normalizedQuery.includes('adresse')) {
      result = this.extractAddress(text, normalizedQuery);
    } else if (normalizedQuery.includes('montant') || normalizedQuery.includes('somme') || normalizedQuery.includes('prix')) {
      result = this.extractAmount(text, normalizedQuery);
    } else if (normalizedQuery.includes('numéro') || normalizedQuery.includes('téléphone')) {
      result = this.extractPhoneNumber(text, normalizedQuery);
    } else if (normalizedQuery.includes('email') || normalizedQuery.includes('courriel')) {
      result = this.extractEmail(text, normalizedQuery);
    } else {
      // Extraction générique de texte avec des mots-clés
      const keywords = normalizedQuery.split(' ')
        .filter(word => word.length > 3)
        .map(word => word.replace(/[^\w\s]/gi, ''));

      if (keywords.length > 0) {
        const pattern = new RegExp(`[^.!?]*(?:${keywords.join('|')})[^.!?]*[.!?]`, 'gi');
        const matches = text.match(pattern);

        if (matches && matches.length > 0) {
          result.found = true;
          result.value = matches[0].trim();
          result.confidence = 0.6;
          result.context = matches[0].trim();
        }
      }
    }

    return result;
  }

  /**
   * Extrait une date du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractDate(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Formats de date européens et américains
    const datePatterns = [
      // Format JJ/MM/AAAA ou JJ-MM-AAAA
      { regex: /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, confidence: 0.9 },
      // Format AAAA/MM/JJ ou AAAA-MM-JJ
      { regex: /(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/g, confidence: 0.9 },
      // Formats en texte (1er janvier 2020, 1 janv. 2020, etc.)
      { regex: /(\d{1,2})(?:er|e|ème)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv\.?|févr\.?|avr\.?|juil\.?|sept\.?|oct\.?|nov\.?|déc\.?)\s+(\d{4})/gi, confidence: 0.95 },
      // Format en anglais (January 1st, 2020, Jan 1, 2020, etc.)
      { regex: /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/gi, confidence: 0.85 }
    ];

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*(?:\\d+[\/\.-]\\d+[\/\.-]\\d+|\\d{1,2}\\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv|févr|avr|juil|sept|oct|nov|déc)\\.?\\s+\\d{4})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des dates dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      // Parcourir les patterns de date
      for (const pattern of datePatterns) {
        const dateMatches = [...context.matchAll(pattern.regex)];
        if (dateMatches.length > 0) {
          result.found = true;
          result.value = dateMatches[0][0];
          result.confidence = pattern.confidence;
          break;
        }
      }
    }

    // Si aucune date n'a été trouvée dans le contexte, chercher dans tout le texte
    if (!result.found) {
      for (const pattern of datePatterns) {
        const dateMatches = [...text.matchAll(pattern.regex)];
        if (dateMatches.length > 0) {
          result.found = true;
          result.value = dateMatches[0][0];
          result.confidence = pattern.confidence * 0.7; // Confiance réduite car hors contexte

          // Extraire un contexte autour de la date
          const dateIndex = text.indexOf(dateMatches[0][0]);
          const start = Math.max(0, dateIndex - 50);
          const end = Math.min(text.length, dateIndex + dateMatches[0][0].length + 50);
          result.context = text.substring(start, end).trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extrait un nom du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractName(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Patterns pour les noms
    const namePatterns = [
      // Nom précédé par "M.", "Mme", "Monsieur", "Madame", etc.
      { regex: /(?:M\.|Mme\.?|Monsieur|Madame|Dr\.?|Me\.?)\s+([A-Z][a-zà-ÿ]+(?:\s+[A-Z][a-zà-ÿ]+){1,4})/g, confidence: 0.9 },
      // Nom tout en majuscules
      { regex: /([A-ZÀ-Ÿ]{2,}\s+[A-ZÀ-Ÿ]{2,})/g, confidence: 0.8 },
      // Nom et prénom standard (Prénom Nom)
      { regex: /([A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)?\s+[A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)?)/g, confidence: 0.7 }
    ];

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des noms dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      // Parcourir les patterns de nom
      for (const pattern of namePatterns) {
        const nameMatches = [...context.matchAll(pattern.regex)];
        if (nameMatches.length > 0) {
          result.found = true;
          result.value = nameMatches[0][1] || nameMatches[0][0];
          result.confidence = pattern.confidence;
          break;
        }
      }
    }

    // Si aucun nom n'a été trouvé dans le contexte, chercher dans tout le texte
    if (!result.found) {
      for (const pattern of namePatterns) {
        const nameMatches = [...text.matchAll(pattern.regex)];
        if (nameMatches.length > 0) {
          result.found = true;
          result.value = nameMatches[0][1] || nameMatches[0][0];
          result.confidence = pattern.confidence * 0.7; // Confiance réduite car hors contexte

          // Extraire un contexte autour du nom
          const nameValue = nameMatches[0][1] || nameMatches[0][0];
          const nameIndex = text.indexOf(nameValue);
          const start = Math.max(0, nameIndex - 50);
          const end = Math.min(text.length, nameIndex + nameValue.length + 50);
          result.context = text.substring(start, end).trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extrait une adresse du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractAddress(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Patterns pour les adresses
    const addressPatterns = [
      // Adresse avec numéro, rue, code postal et ville
      { regex: /(\d+(?:[a-z])?(?:\s+bis|\s+ter)?)[\s,]+(?:rue|avenue|boulevard|impasse|chemin|place|cours|allée|route)[\s\w,'-]+\d{5}[\s,]+[\w\s'-]+/gi, confidence: 0.9 },
      // Adresse avec "demeurant à", "résidant à", etc.
      { regex: /(?:demeurant|résidant|domicilié|habitant)(?:\s+à)?\s+([^.!?\n]{10,80})/gi, confidence: 0.85 }
    ];

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des adresses dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      // Parcourir les patterns d'adresse
      for (const pattern of addressPatterns) {
        const addressMatches = [...context.matchAll(pattern.regex)];
        if (addressMatches.length > 0) {
          result.found = true;
          result.value = addressMatches[0][1] || addressMatches[0][0];
          result.confidence = pattern.confidence;
          break;
        }
      }
    }

    // Si aucune adresse n'a été trouvée dans le contexte, chercher dans tout le texte
    if (!result.found) {
      for (const pattern of addressPatterns) {
        const addressMatches = [...text.matchAll(pattern.regex)];
        if (addressMatches.length > 0) {
          result.found = true;
          result.value = addressMatches[0][1] || addressMatches[0][0];
          result.confidence = pattern.confidence * 0.7; // Confiance réduite car hors contexte

          // Extraire un contexte autour de l'adresse
          const addressValue = addressMatches[0][1] || addressMatches[0][0];
          const addressIndex = text.indexOf(addressValue);
          const start = Math.max(0, addressIndex - 50);
          const end = Math.min(text.length, addressIndex + addressValue.length + 50);
          result.context = text.substring(start, end).trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extrait un montant du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractAmount(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Patterns pour les montants
    const amountPatterns = [
      // Montant en euros avec symbole (123,45 €, 123.45€, etc.)
      { regex: /(\d+(?:[.,]\d+)?)\s*(?:€|EUR|euros?)/gi, confidence: 0.9 },
      // Montant en euros avec texte (123 euros, 123,45 euros, etc.)
      { regex: /(\d+(?:[.,]\d+)?)\s+euros?/gi, confidence: 0.9 },
      // Montant en lettres jusqu'à mille
      { regex: /(?:montant|somme|prix)(?: de| d')?\s+(?:[a-zéèêëàâäôöûüùïîçñ]+(?:-|\s+)){1,8}(?:euros?|€)/gi, confidence: 0.8 }
    ];

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des montants dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      // Parcourir les patterns de montant
      for (const pattern of amountPatterns) {
        const amountMatches = [...context.matchAll(pattern.regex)];
        if (amountMatches.length > 0) {
          result.found = true;
          result.value = amountMatches[0][1] || amountMatches[0][0];
          result.confidence = pattern.confidence;
          break;
        }
      }
    }

    // Si aucun montant n'a été trouvé dans le contexte, chercher dans tout le texte
    if (!result.found) {
      for (const pattern of amountPatterns) {
        const amountMatches = [...text.matchAll(pattern.regex)];
        if (amountMatches.length > 0) {
          result.found = true;
          result.value = amountMatches[0][1] || amountMatches[0][0];
          result.confidence = pattern.confidence * 0.7; // Confiance réduite car hors contexte

          // Extraire un contexte autour du montant
          const amountValue = amountMatches[0][1] || amountMatches[0][0];
          const amountIndex = text.indexOf(amountValue);
          const start = Math.max(0, amountIndex - 50);
          const end = Math.min(text.length, amountIndex + amountValue.length + 50);
          result.context = text.substring(start, end).trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extrait un numéro de téléphone du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractPhoneNumber(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Patterns pour les numéros de téléphone
    const phonePatterns = [
      // Format français (06 12 34 56 78, 06.12.34.56.78, etc.)
      { regex: /(?:0|\+33|0033)\s*[1-9](?:[\s.-]*\d{2}){4}/g, confidence: 0.9 },
      // Format international (+33 6 12 34 56 78, etc.)
      { regex: /\+\d{2}\s*[1-9](?:[\s.-]*\d{2}){4}/g, confidence: 0.9 }
    ];

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des numéros de téléphone dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      // Parcourir les patterns de numéro de téléphone
      for (const pattern of phonePatterns) {
        const phoneMatches = context.match(pattern.regex);
        if (phoneMatches && phoneMatches.length > 0) {
          result.found = true;
          result.value = phoneMatches[0];
          result.confidence = pattern.confidence;
          break;
        }
      }
    }

    // Si aucun numéro de téléphone n'a été trouvé dans le contexte, chercher dans tout le texte
    if (!result.found) {
      for (const pattern of phonePatterns) {
        const phoneMatches = text.match(pattern.regex);
        if (phoneMatches && phoneMatches.length > 0) {
          result.found = true;
          result.value = phoneMatches[0];
          result.confidence = pattern.confidence * 0.7; // Confiance réduite car hors contexte

          // Extraire un contexte autour du numéro de téléphone
          const phoneIndex = text.indexOf(phoneMatches[0]);
          const start = Math.max(0, phoneIndex - 50);
          const end = Math.min(text.length, phoneIndex + phoneMatches[0].length + 50);
          result.context = text.substring(start, end).trim();
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extrait une adresse email du texte
   * @param {string} text - Texte à analyser
   * @param {string} query - Demande d'extraction
   * @returns {Object} - Résultat d'extraction
   */
  extractEmail(text, query) {
    const result = { found: false, value: null, confidence: 0, context: null };

    // Pattern pour les emails
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Chercher dans le contexte de mots-clés liés à la demande
    const keywords = this.getKeywordsForQuery(query);
    const keywordPattern = new RegExp(`[^.!?\n]*(?:${keywords.join('|')})[^.!?\n]*`, 'gi');
    const contextMatches = text.match(keywordPattern);

    // Chercher des emails dans le contexte trouvé
    if (contextMatches && contextMatches.length > 0) {
      const context = contextMatches[0];
      result.context = context.trim();

      const emailMatches = context.match(emailPattern);
      if (emailMatches && emailMatches.length > 0) {
        result.found = true;
        result.value = emailMatches[0];
        result.confidence = 0.9;
      }
    }

    // Si aucun email n'a été trouvé dans le contexte, chercher dans tout le texte
    if (!result.found) {
      const emailMatches = text.match(emailPattern);
      if (emailMatches && emailMatches.length > 0) {
        result.found = true;
        result.value = emailMatches[0];
        result.confidence = 0.7; // Confiance réduite car hors contexte

        // Extraire un contexte autour de l'email
        const emailIndex = text.indexOf(emailMatches[0]);
        const start = Math.max(0, emailIndex - 50);
        const end = Math.min(text.length, emailIndex + emailMatches[0].length + 50);
        result.context = text.substring(start, end).trim();
      }
    }

    return result;
  }

  /**
   * Obtient les mots-clés liés à une demande
   * @param {string} query - Demande d'extraction
   * @returns {Array<string>} - Liste de mots-clés
   */
  getKeywordsForQuery(query) {
    const normalizedQuery = query.toLowerCase();

    // Mots-clés selon le type de demande
    if (normalizedQuery.includes('date') && normalizedQuery.includes('expiration')) {
      return ['expiration', 'expire', 'valable', 'validité', 'jusqu\'au', 'jusqu\'à', 'date limite'];
    } else if (normalizedQuery.includes('date') && normalizedQuery.includes('naissance')) {
      return ['naissance', 'né', 'née', 'le'];
    } else if (normalizedQuery.includes('date') && normalizedQuery.includes('signature')) {
      return ['signé', 'signature', 'fait à', 'fait le', 'daté du'];
    } else if (normalizedQuery.includes('nom')) {
      return ['nom', 'prénom', 'identité', 'soussigné', 'je', 'monsieur', 'madame', 'm.', 'mme'];
    } else if (normalizedQuery.includes('adresse')) {
      return ['adresse', 'domicile', 'demeurant', 'résidant', 'habite', 'domicilié'];
    } else if (normalizedQuery.includes('montant') || normalizedQuery.includes('somme') || normalizedQuery.includes('prix')) {
      return ['montant', 'somme', 'prix', 'coût', 'euros', '€', 'eur', 'total'];
    } else if (normalizedQuery.includes('téléphone')) {
      return ['téléphone', 'tél', 'tel', 'mobile', 'portable', 'contact'];
    } else if (normalizedQuery.includes('email') || normalizedQuery.includes('courriel')) {
      return ['email', 'e-mail', 'mail', 'courriel', 'électronique', 'contact'];
    } else {
      // Extraire les mots-clés de la demande elle-même
      return normalizedQuery.split(' ')
        .filter(word => word.length > 3)
        .map(word => word.replace(/[^\w\s]/gi, ''));
    }
  }

  /**
   * Sauvegarde les résultats d'extraction dans un fichier JSON
   * @param {Object} result - Résultat d'extraction
   * @param {string} query - Demande d'extraction
   * @param {string} outputPath - Chemin de sortie
   * @returns {string} - Chemin du fichier sauvegardé
   */
  saveExtractionResult(result, query, outputPath) {
    const outputData = {
      query,
      extractionResult: result,
      timestamp: new Date().toISOString()
    };

    const resultPath = outputPath.replace('.txt', '_extraction.json');
    fs.writeFileSync(resultPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Résultat d'extraction sauvegardé dans: ${resultPath}`);

    return resultPath;
  }
}

/**
 * Fonction d'aide pour extraire une information spécifique d'un document
 * @param {string} text - Texte à analyser
 * @param {string} query - Demande d'extraction
 * @param {boolean} useAI - Utiliser l'IA pour l'extraction
 * @returns {Promise<Object>} - Résultat de l'extraction
 */
export async function extractSpecificInfo(text, query, useAI = true) {
  const extractor = new InfoExtractor(useAI);
  return await extractor.extractInfo(text, query);
}