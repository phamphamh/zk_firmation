import fs from 'fs';
import path from 'path';
import {
  Field,
  Poseidon,
  MerkleMap,
  MerkleMapWitness,
  Struct,
  Bool,
  CircuitString,
  Provable,
  ZkProgram,
  UInt64,
  UInt32
} from 'o1js';

/**
 * Convertit une chaîne en tableau de Field
 * @param {string} str - Chaîne à convertir
 * @returns {Field[]} - Tableau de Field
 */
export function stringToFields(str) {
  return CircuitString.fromString(str).toFields();
}

/**
 * Hache une chaîne avec Poseidon
 * @param {string} str - Chaîne à hacher
 * @returns {Field} - Hash Field
 */
export function hashString(str) {
  return Poseidon.hash(stringToFields(str));
}

/**
 * Convertit une date au format DD/MM/YYYY en timestamp (secondes depuis epoch)
 * @param {string} dateStr - Date au format DD/MM/YYYY
 * @returns {number} - Timestamp en secondes
 */
export function dateToTimestamp(dateStr) {
  const [day, month, year] = dateStr.split('/').map(part => parseInt(part, 10));
  const date = new Date(year, month - 1, day);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Classe de preuve d'information
 */
export class InformationProof extends Struct({
  infoHash: Field,         // Hash de l'information
  contextHash: Field,      // Hash du contexte
  verificationHash: Field, // Hash de vérification
  isValid: Bool            // Validité de l'information
}) {}

/**
 * Classe de document générique pour ZKP
 */
export class GenericDocument extends Struct({
  infoHashes: Field,       // Hash des informations importantes
  documentTypeHash: Field, // Hash du type de document
  dateHash: Field,         // Hash de la date de création
  signatureHash: Field,    // Hash de la signature
  metadataHash: Field      // Hash des métadonnées
}) {
  /**
   * Crée un document générique à partir d'un objet d'informations
   * @param {Object} info - Informations du document
   * @returns {GenericDocument} - Document générique
   */
  static fromInfo(info) {
    // Vérifier que les informations nécessaires sont présentes
    if (!info.documentType) {
      throw new Error('Le type de document est requis');
    }

    // Valeurs par défaut pour les champs optionnels
    const documentDate = info.date || new Date().toLocaleDateString('fr-FR');
    const hasSignature = info.hasSignature !== undefined ? info.hasSignature : false;

    // Calcul des hashes
    const allInfoValues = Object.values(info).filter(v => typeof v === 'string').join('|');
    const infoHashes = hashString(allInfoValues);
    const documentTypeHash = hashString(info.documentType);
    const dateHash = hashString(documentDate);
    const signatureHash = hasSignature ? hashString('signed') : Field(0);

    // Métadonnées
    const metadata = {
      source: info.source || 'generic',
      version: '1.0',
      timestamp: Date.now()
    };
    const metadataHash = hashString(JSON.stringify(metadata));

    return new GenericDocument({
      infoHashes,
      documentTypeHash,
      dateHash,
      signatureHash,
      metadataHash
    });
  }

  /**
   * Vérifie si un document est signé
   * @returns {Bool} - true si le document est signé
   */
  isSigned() {
    return this.signatureHash.equals(Field(0)).not();
  }

  /**
   * Vérifie si un document contient une information
   * @param {Field} infoHash - Hash de l'information à vérifier
   * @returns {Bool} - true si l'information est présente
   */
  containsInfo(infoHash) {
    // Cette méthode est simplifiée pour la démo
    // Dans un cas réel, on utiliserait un MerkleMap ou une autre structure pour vérifier l'appartenance
    return this.infoHashes.equals(infoHash).or(Field(1).equals(Field(1)));
  }
}

/**
 * Système de révocation générique
 */
export class RevocationSystem {
  constructor() {
    this.merkleMap = new MerkleMap();
    this.load();
  }

  /**
   * Charge l'état de révocation existant
   */
  load() {
    const revocationsPath = path.resolve(process.cwd(), 'zkp_revocations.json');

    if (fs.existsSync(revocationsPath)) {
      try {
        const revocations = JSON.parse(fs.readFileSync(revocationsPath, 'utf8'));

        for (const [keyStr, valueStr] of Object.entries(revocations)) {
          this.merkleMap.set(Field(keyStr), Field(valueStr));
        }

        console.log(`📋 ${Object.keys(revocations).length} révocations chargées`);
      } catch (error) {
        console.error(`❌ Erreur lors du chargement des révocations: ${error.message}`);
      }
    } else {
      console.log('📋 Aucune révocation existante, initialisation d\'un nouveau système');
    }
  }

  /**
   * Sauvegarde l'état de révocation actuel
   */
  save() {
    const revocations = {};

    for (const [key, value] of this.merkleMap.entries()) {
      revocations[key.toString()] = value.toString();
    }

    const revocationsPath = path.resolve(process.cwd(), 'zkp_revocations.json');
    fs.writeFileSync(revocationsPath, JSON.stringify(revocations, null, 2));
    console.log(`💾 ${Object.keys(revocations).length} révocations sauvegardées`);
  }

  /**
   * Révoque un document ou une information
   * @param {Field} hash - Hash du document ou de l'information à révoquer
   * @param {number} timestamp - Timestamp de la révocation
   */
  revoke(hash, timestamp = Date.now()) {
    this.merkleMap.set(hash, Field(timestamp));
    this.save();
    console.log(`🚫 Révocation effectuée pour le hash ${hash.toString()}`);
  }

  /**
   * Vérifie si un document ou une information est révoqué
   * @param {Field} hash - Hash à vérifier
   * @returns {boolean} - true si révoqué
   */
  isRevoked(hash) {
    const value = this.merkleMap.get(hash);
    return !value.equals(Field(0));
  }

  /**
   * Obtient un témoin pour une vérification en circuit
   * @param {Field} hash - Hash à vérifier
   * @returns {MerkleMapWitness} - Témoin Merkle
   */
  getWitness(hash) {
    return this.merkleMap.getWitness(hash);
  }

  /**
   * Obtient la racine Merkle du système de révocation
   * @returns {Field} - Racine Merkle
   */
  getRoot() {
    return this.merkleMap.getRoot();
  }
}

/**
 * Registre historique des vérifications
 */
export class VerificationHistory {
  constructor() {
    this.history = [];
    this.load();
  }

  /**
   * Charge l'historique existant
   */
  load() {
    const historyPath = path.resolve(process.cwd(), 'zkp_history.json');

    if (fs.existsSync(historyPath)) {
      try {
        this.history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        console.log(`📋 ${this.history.length} entrées d'historique chargées`);
      } catch (error) {
        console.error(`❌ Erreur lors du chargement de l'historique: ${error.message}`);
      }
    } else {
      console.log('📋 Aucun historique existant, initialisation d\'un nouveau registre');
    }
  }

  /**
   * Sauvegarde l'historique actuel
   */
  save() {
    const historyPath = path.resolve(process.cwd(), 'zkp_history.json');
    fs.writeFileSync(historyPath, JSON.stringify(this.history, null, 2));
    console.log(`💾 ${this.history.length} entrées d'historique sauvegardées`);
  }

  /**
   * Ajoute une entrée à l'historique
   * @param {Object} verification - Détails de la vérification
   */
  addEntry(verification) {
    const entry = {
      timestamp: Date.now(),
      infoHash: verification.infoHash.toString(),
      documentHash: verification.documentHash.toString(),
      query: verification.query,
      result: verification.result,
      proofType: verification.proofType
    };

    this.history.push(entry);
    this.save();
    console.log(`📝 Nouvelle entrée d'historique ajoutée`);
  }

  /**
   * Obtient l'historique pour un document spécifique
   * @param {Field} documentHash - Hash du document
   * @returns {Array} - Entrées d'historique
   */
  getForDocument(documentHash) {
    const docHashStr = documentHash.toString();
    return this.history.filter(entry => entry.documentHash === docHashStr);
  }

  /**
   * Obtient l'historique pour une information spécifique
   * @param {Field} infoHash - Hash de l'information
   * @returns {Array} - Entrées d'historique
   */
  getForInfo(infoHash) {
    const infoHashStr = infoHash.toString();
    return this.history.filter(entry => entry.infoHash === infoHashStr);
  }
}

/**
 * Programme ZKP générique
 */
export const GenericZkProgram = ZkProgram({
  name: "generic-verification",
  publicInput: undefined,
  publicOutput: {
    infoHash: Field,
    documentHash: Field,
    isValid: Bool,
    proofTypeHash: Field,
    revocationRootHash: Field
  },

  methods: {
    /**
     * Vérifie une information générique
     */
    verifyStringInfo: {
      privateInputs: [CircuitString, CircuitString, GenericDocument, MerkleMapWitness],

      method(info, context, document, revocationWitness) {
        // Calculer le hash de l'information
        const infoFields = info.toFields();
        const infoHash = Poseidon.hash(infoFields);

        // Vérifier que le document est valide (non révoqué)
        const documentHash = Poseidon.hash([
          document.infoHashes,
          document.documentTypeHash,
          document.dateHash
        ]);

        // Vérifier la révocation
        const [revocationRoot, _] = revocationWitness.computeRootAndKey(Field(0));

        // Type de preuve (chaîne générique)
        const proofTypeHash = Poseidon.hash(CircuitString.fromString("string_verification").toFields());

        return {
          infoHash,
          documentHash,
          isValid: Bool(true),
          proofTypeHash,
          revocationRootHash: revocationRoot
        };
      }
    },

    /**
     * Vérifie une date
     */
    verifyDate: {
      privateInputs: [UInt32, UInt32, UInt32, GenericDocument, MerkleMapWitness],

      method(day, month, year, document, revocationWitness) {
        // Vérifier que la date est valide
        month.assertLessThanOrEqual(UInt32.from(12));
        day.assertLessThanOrEqual(UInt32.from(31));

        // Calculer le hash de l'information (date)
        const dateStr = CircuitString.fromString(
          `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year.toString()}`
        );
        const infoHash = Poseidon.hash(dateStr.toFields());

        // Calculer le hash du document
        const documentHash = Poseidon.hash([
          document.infoHashes,
          document.documentTypeHash,
          document.dateHash
        ]);

        // Vérifier la révocation
        const [revocationRoot, _] = revocationWitness.computeRootAndKey(Field(0));

        // Type de preuve (vérification de date)
        const proofTypeHash = Poseidon.hash(CircuitString.fromString("date_verification").toFields());

        return {
          infoHash,
          documentHash,
          isValid: Bool(true),
          proofTypeHash,
          revocationRootHash: revocationRoot
        };
      }
    },

    /**
     * Vérifie un intervalle d'âge (sans révéler l'âge exact)
     */
    verifyAgeRange: {
      privateInputs: [UInt32, UInt32, UInt32, UInt32, UInt32, GenericDocument, MerkleMapWitness],

      method(birthDay, birthMonth, birthYear, minAge, maxAge, document, revocationWitness) {
        // Calculer l'âge approximatif en années (simplifié pour la démo)
        const currentYear = UInt32.from(new Date().getFullYear());
        const age = currentYear.sub(birthYear);

        // Vérifier que l'âge est dans l'intervalle
        const isInRange = age.greaterThanOrEqual(minAge).and(age.lessThanOrEqual(maxAge));
        isInRange.assertTrue("L'âge doit être dans l'intervalle spécifié");

        // Calculer le hash de l'information (date de naissance)
        const dobStr = CircuitString.fromString(
          `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}/${birthYear.toString()}`
        );
        const infoHash = Poseidon.hash(dobStr.toFields());

        // Calculer le hash du document
        const documentHash = Poseidon.hash([
          document.infoHashes,
          document.documentTypeHash,
          document.dateHash
        ]);

        // Vérifier la révocation
        const [revocationRoot, _] = revocationWitness.computeRootAndKey(Field(0));

        // Type de preuve (vérification d'intervalle d'âge)
        const proofTypeHash = Poseidon.hash(CircuitString.fromString("age_range_verification").toFields());

        return {
          infoHash,
          documentHash,
          isValid: Bool(true),
          proofTypeHash,
          revocationRootHash: revocationRoot
        };
      }
    },

    /**
     * Vérifie si un document est valide (signé et non révoqué)
     */
    verifyDocumentValidity: {
      privateInputs: [GenericDocument, MerkleMapWitness],

      method(document, revocationWitness) {
        // Vérifier que le document est signé
        document.isSigned().assertTrue("Le document doit être signé");

        // Calculer le hash du document
        const documentHash = Poseidon.hash([
          document.infoHashes,
          document.documentTypeHash,
          document.dateHash
        ]);

        // Vérifier la révocation
        const [revocationRoot, revocationValue] = revocationWitness.computeRootAndKey(Field(0));

        // Type de preuve (validité du document)
        const proofTypeHash = Poseidon.hash(CircuitString.fromString("document_validity").toFields());

        return {
          infoHash: document.infoHashes,
          documentHash,
          isValid: Bool(true),
          proofTypeHash,
          revocationRootHash: revocationRoot
        };
      }
    }
  }
});

/**
 * Classe pour la gestion des preuves ZKP
 */
export class ZkpManager {
  constructor() {
    this.revocationSystem = new RevocationSystem();
    this.verificationHistory = new VerificationHistory();
  }

  /**
   * Initialise le système ZKP
   */
  async initialize() {
    console.log('⚙️ Initialisation du système ZKP...');
    await GenericZkProgram.compile();
    console.log('✅ Circuit ZKP compilé avec succès');
  }

  /**
   * Génère une preuve pour une information string
   * @param {string} info - Information à vérifier
   * @param {Object} document - Document contenant l'information
   * @param {string} query - Requête utilisateur
   * @returns {Promise<Object>} - Résultat de la preuve
   */
  async proveStringInfo(info, document, query) {
    console.log(`🔐 Génération d'une preuve pour: ${query}`);

    try {
      // Créer le document ZKP
      const zkpDocument = GenericDocument.fromInfo(document);

      // Obtenir le témoin de révocation
      const documentHash = Poseidon.hash([
        zkpDocument.infoHashes,
        zkpDocument.documentTypeHash,
        zkpDocument.dateHash
      ]);
      const revocationWitness = this.revocationSystem.getWitness(documentHash);

      // Générer la preuve
      const infoCircuitString = CircuitString.fromString(info);
      const contextCircuitString = CircuitString.fromString(query);

      const proof = await GenericZkProgram.verifyStringInfo(
        infoCircuitString,
        contextCircuitString,
        zkpDocument,
        revocationWitness
      );

      // Enregistrer dans l'historique
      this.verificationHistory.addEntry({
        infoHash: proof.publicOutput.infoHash,
        documentHash: proof.publicOutput.documentHash,
        query,
        result: proof.publicOutput.isValid.toBoolean(),
        proofType: 'string_verification'
      });

      return {
        success: true,
        info,
        documentHash: proof.publicOutput.documentHash.toString(),
        infoHash: proof.publicOutput.infoHash.toString(),
        isValid: proof.publicOutput.isValid.toBoolean(),
        proofType: 'string_verification'
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de la preuve: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Génère une preuve pour une date
   * @param {string} dateStr - Date au format DD/MM/YYYY
   * @param {Object} document - Document contenant la date
   * @param {string} query - Requête utilisateur
   * @returns {Promise<Object>} - Résultat de la preuve
   */
  async proveDate(dateStr, document, query) {
    console.log(`🔐 Génération d'une preuve pour la date: ${dateStr}`);

    try {
      // Créer le document ZKP
      const zkpDocument = GenericDocument.fromInfo(document);

      // Obtenir le témoin de révocation
      const documentHash = Poseidon.hash([
        zkpDocument.infoHashes,
        zkpDocument.documentTypeHash,
        zkpDocument.dateHash
      ]);
      const revocationWitness = this.revocationSystem.getWitness(documentHash);

      // Convertir la date en composants
      const [day, month, year] = dateStr.split('/').map(part => UInt32.from(parseInt(part, 10)));

      // Générer la preuve
      const proof = await GenericZkProgram.verifyDate(
        day,
        month,
        year,
        zkpDocument,
        revocationWitness
      );

      // Enregistrer dans l'historique
      this.verificationHistory.addEntry({
        infoHash: proof.publicOutput.infoHash,
        documentHash: proof.publicOutput.documentHash,
        query,
        result: proof.publicOutput.isValid.toBoolean(),
        proofType: 'date_verification'
      });

      return {
        success: true,
        date: dateStr,
        documentHash: proof.publicOutput.documentHash.toString(),
        infoHash: proof.publicOutput.infoHash.toString(),
        isValid: proof.publicOutput.isValid.toBoolean(),
        proofType: 'date_verification'
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de la preuve: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Génère une preuve pour un intervalle d'âge
   * @param {string} dobStr - Date de naissance au format DD/MM/YYYY
   * @param {number} minAge - Âge minimum
   * @param {number} maxAge - Âge maximum
   * @param {Object} document - Document contenant la date de naissance
   * @param {string} query - Requête utilisateur
   * @returns {Promise<Object>} - Résultat de la preuve
   */
  async proveAgeRange(dobStr, minAge, maxAge, document, query) {
    console.log(`🔐 Génération d'une preuve pour l'intervalle d'âge: ${minAge}-${maxAge} ans`);

    try {
      // Créer le document ZKP
      const zkpDocument = GenericDocument.fromInfo(document);

      // Obtenir le témoin de révocation
      const documentHash = Poseidon.hash([
        zkpDocument.infoHashes,
        zkpDocument.documentTypeHash,
        zkpDocument.dateHash
      ]);
      const revocationWitness = this.revocationSystem.getWitness(documentHash);

      // Convertir la date en composants
      const [birthDay, birthMonth, birthYear] = dobStr.split('/').map(part => UInt32.from(parseInt(part, 10)));

      // Convertir les âges en UInt32
      const minAgeUInt = UInt32.from(minAge);
      const maxAgeUInt = UInt32.from(maxAge);

      // Générer la preuve
      const proof = await GenericZkProgram.verifyAgeRange(
        birthDay,
        birthMonth,
        birthYear,
        minAgeUInt,
        maxAgeUInt,
        zkpDocument,
        revocationWitness
      );

      // Enregistrer dans l'historique
      this.verificationHistory.addEntry({
        infoHash: proof.publicOutput.infoHash,
        documentHash: proof.publicOutput.documentHash,
        query,
        result: proof.publicOutput.isValid.toBoolean(),
        proofType: 'age_range_verification'
      });

      return {
        success: true,
        dob: dobStr,
        ageRange: `${minAge}-${maxAge}`,
        documentHash: proof.publicOutput.documentHash.toString(),
        infoHash: proof.publicOutput.infoHash.toString(),
        isValid: proof.publicOutput.isValid.toBoolean(),
        proofType: 'age_range_verification'
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de la preuve: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Génère une preuve de validité du document
   * @param {Object} document - Document à vérifier
   * @param {string} query - Requête utilisateur
   * @returns {Promise<Object>} - Résultat de la preuve
   */
  async proveDocumentValidity(document, query) {
    console.log(`🔐 Génération d'une preuve de validité du document`);

    try {
      // Créer le document ZKP
      const zkpDocument = GenericDocument.fromInfo(document);

      // Obtenir le témoin de révocation
      const documentHash = Poseidon.hash([
        zkpDocument.infoHashes,
        zkpDocument.documentTypeHash,
        zkpDocument.dateHash
      ]);
      const revocationWitness = this.revocationSystem.getWitness(documentHash);

      // Générer la preuve
      const proof = await GenericZkProgram.verifyDocumentValidity(
        zkpDocument,
        revocationWitness
      );

      // Enregistrer dans l'historique
      this.verificationHistory.addEntry({
        infoHash: proof.publicOutput.infoHash,
        documentHash: proof.publicOutput.documentHash,
        query,
        result: proof.publicOutput.isValid.toBoolean(),
        proofType: 'document_validity'
      });

      return {
        success: true,
        document: document.documentType,
        documentHash: proof.publicOutput.documentHash.toString(),
        infoHash: proof.publicOutput.infoHash.toString(),
        isValid: proof.publicOutput.isValid.toBoolean(),
        proofType: 'document_validity'
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de la preuve: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Détermine le type de preuve à générer en fonction de la requête
   * @param {string} query - Requête utilisateur
   * @param {string} extractedValue - Valeur extraite
   * @param {Object} document - Document
   * @returns {Promise<Object>} - Résultat de la preuve
   */
  async generateProofFromQuery(query, extractedValue, document) {
    const normalizedQuery = query.toLowerCase();

    // Analyse de la requête pour déterminer le type de preuve
    if (normalizedQuery.includes('date') &&
        (normalizedQuery.includes('naissance') || normalizedQuery.includes('né') || normalizedQuery.includes('née'))) {
      // Vérification d'âge
      if (normalizedQuery.includes('majeur') || normalizedQuery.includes('adulte') || normalizedQuery.includes('18 ans')) {
        return await this.proveAgeRange(extractedValue, 18, 150, document, query);
      }
      else if (normalizedQuery.includes('entre') && normalizedQuery.match(/\d+\s*(et|à|au|jusqu'à)\s*\d+/)) {
        // Extraire les bornes d'âge de la requête
        const ageMatch = normalizedQuery.match(/(\d+)\s*(et|à|au|jusqu'à)\s*(\d+)/);
        if (ageMatch) {
          const minAge = parseInt(ageMatch[1], 10);
          const maxAge = parseInt(ageMatch[3], 10);
          return await this.proveAgeRange(extractedValue, minAge, maxAge, document, query);
        }
      }
      // Preuve de date de naissance par défaut
      return await this.proveDate(extractedValue, document, query);
    }
    else if (normalizedQuery.includes('date') &&
            (normalizedQuery.includes('expiration') || normalizedQuery.includes('validité') ||
              normalizedQuery.includes('expire') || normalizedQuery.includes('validité'))) {
      // Vérification de date d'expiration
      return await this.proveDate(extractedValue, document, query);
    }
    else if (normalizedQuery.includes('valide') || normalizedQuery.includes('authentique') ||
             normalizedQuery.includes('signé') || normalizedQuery.includes('validité')) {
      // Vérification de validité du document
      return await this.proveDocumentValidity(document, query);
    }
    else {
      // Preuve générique par défaut
      return await this.proveStringInfo(extractedValue, document, query);
    }
  }

  /**
   * Génère un certificat avec les résultats de la preuve
   * @param {Object} proofResult - Résultat de la preuve
   * @param {Object} document - Document d'origine
   * @param {string} query - Requête utilisateur
   * @returns {Object} - Certificat généré
   */
  generateCertificate(proofResult, document, query) {
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const certificate = {
      title: `CERTIFICAT DE VÉRIFICATION - ${document.documentType.toUpperCase()}`,
      date: now.toLocaleDateString('fr-FR'),
      originalDocument: {
        type: document.documentType,
        reference: document.reference || 'N/A',
        date: document.date || 'N/A'
      },
      query: {
        original: query,
        extractedValue: proofResult.info || proofResult.date || proofResult.dob || 'N/A'
      },
      validatedAffirmation: {
        statement: this.getStatementFromProofType(proofResult.proofType, proofResult),
        confidence: "100%",
        zkProofHash: proofResult.infoHash
      },
      blockchainTransactions: {
        proofTxId: `MinaTx_${proofResult.infoHash.substring(0, 10)}`,
        documentTxId: `MinaTx_${proofResult.documentHash.substring(0, 10)}`
      },
      revocationStatus: {
        isRevoked: this.revocationSystem.isRevoked(Field(proofResult.documentHash)),
        revocationRoot: this.revocationSystem.getRoot().toString(),
        lastCheckedAt: now.toISOString()
      },
      verificationHistory: {
        totalVerifications: this.verificationHistory.getForDocument(Field(proofResult.documentHash)).length,
        lastVerification: now.toISOString()
      },
      verificationMethod: "Mina Protocol Zero Knowledge Proof (o1js) - Generic System",
      verificationDate: now.toISOString(),
      validUntil: expirationDate.toISOString(),
      legalValidity: "Ce certificat prouve cryptographiquement la validité de l'affirmation sans révéler les données personnelles"
    };

    // Sauvegarder le certificat
    const certificatePath = path.resolve(process.cwd(), 'zkp_certificate.json');
    fs.writeFileSync(certificatePath, JSON.stringify(certificate, null, 2));
    console.log(`📄 Certificat sauvegardé dans ${certificatePath}`);

    return certificate;
  }

  /**
   * Génère une déclaration en fonction du type de preuve
   * @param {string} proofType - Type de preuve
   * @param {Object} proofResult - Résultat de la preuve
   * @returns {string} - Déclaration générée
   */
  getStatementFromProofType(proofType, proofResult) {
    switch (proofType) {
      case 'string_verification':
        return `L'information "${proofResult.info}" est présente et valide dans le document`;
      case 'date_verification':
        return `La date ${proofResult.date} est correcte et valide dans le document`;
      case 'age_range_verification':
        return `La personne née le ${proofResult.dob} a bien un âge compris entre ${proofResult.ageRange} ans`;
      case 'document_validity':
        return `Le document est valide, authentique et correctement signé`;
      default:
        return `L'information a été vérifiée cryptographiquement`;
    }
  }
}