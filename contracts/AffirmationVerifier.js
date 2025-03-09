import {
  Field,
  Struct,
  CircuitString,
  Poseidon,
  ZkProgram,
  SelfProof,
  Provable,
  Bool,
  MerkleTree,
  MerkleWitness
} from 'o1js';

/**
 * Classe pour représenter une affirmation juridique avec preuve ZKP
 */
export class Affirmation extends Struct({
  // Le hash de l'affirmation (par exemple "La personne est majeure")
  affirmationHash: Field,

  // Le hash du document sur lequel porte l'affirmation
  documentHash: Field,

  // Indique si l'affirmation est valide selon les vérifications
  isValid: Bool
}) {
  /**
   * Crée une instance d'Affirmation à partir de chaînes de caractères
   * @param {string} affirmationText - Le texte de l'affirmation
   * @param {string} documentText - Le texte du document
   * @param {boolean} isValid - Validité de l'affirmation
   * @returns {Affirmation} - Instance d'affirmation
   */
  static fromStrings(affirmationText, documentText, isValid) {
    // Limiter la taille des chaînes pour respecter les contraintes de CircuitString
    const maxLength = 20; // Valeur ajustable selon les contraintes du circuit

    const shortAffirmation = affirmationText.substring(0, maxLength);
    const shortDocument = documentText.substring(0, maxLength);

    // Créer des hachages pour représenter les textes (plus sûr que des CircuitString pour de longs textes)
    const affirmationHash = Poseidon.hash(
      CircuitString.fromString(shortAffirmation).toFields()
    );

    const documentHash = Poseidon.hash(
      CircuitString.fromString(shortDocument).toFields()
    );

    return new Affirmation({
      affirmationHash,
      documentHash,
      isValid: Bool(isValid)
    });
  }

  /**
   * Calcule le hash de l'affirmation pour vérification publique
   * @returns {Field} - Hash de l'affirmation
   */
  hash() {
    return Poseidon.hash([
      this.affirmationHash,
      this.documentHash,
      this.isValid.toField()
    ]);
  }
}

/**
 * Classe pour la vérification d'âge basée sur une date de naissance
 */
export class AgeVerification extends Struct({
  // Timestamp UNIX de la date de naissance (en secondes)
  birthDateTimestamp: Field,

  // Timestamp UNIX actuel (en secondes)
  currentTimestamp: Field,

  // Âge minimum requis (en années)
  minimumAge: Field
}) {
  /**
   * Vérifie si une personne a l'âge minimum requis
   * @returns {Bool} - True si la personne a l'âge minimum requis
   */
  hasMinimumAge() {
    // Convertir l'âge minimum en secondes
    // 1 an = 365.25 jours (moyenne) * 24 heures * 60 minutes * 60 secondes
    const secondsPerYear = Field(31557600);
    const minimumAgeInSeconds = this.minimumAge.mul(secondsPerYear);

    // Calculer la différence de temps entre maintenant et la date de naissance
    const ageInSeconds = this.currentTimestamp.sub(this.birthDateTimestamp);

    // Vérifier si l'âge est supérieur ou égal au minimum requis
    return Provable.if(
      ageInSeconds.greaterThanOrEqual(minimumAgeInSeconds),
      Bool(true),
      Bool(false)
    );
  }
}

/**
 * Niveau de preuve pour le circuit
 */
class AffirmationWitness extends MerkleWitness(8) {}

/**
 * Programme ZK pour vérifier les affirmations juridiques
 */
export const AffirmationVerifierProgram = ZkProgram({
  name: "affirmation-verifier",
  publicInput: Field, // Hash public de l'affirmation
  publicOutput: Bool, // Résultat de la vérification

  methods: {
    /**
     * Vérifie la validité d'une affirmation juridique
     * @param {Field} publicAffirmationHash - Hash public de l'affirmation
     * @param {Affirmation} affirmation - L'affirmation à vérifier
     * @returns {Bool} - Résultat de la vérification
     */
    verifyAffirmation: {
      privateInputs: [Affirmation],

      method(publicAffirmationHash, affirmation) {
        // Vérifier que le hash public correspond à l'affirmation
        const computedHash = affirmation.hash();
        computedHash.assertEquals(publicAffirmationHash);

        // Retourner la validité de l'affirmation
        return affirmation.isValid;
      }
    },

    /**
     * Vérifie si une personne est majeure (a plus de 18 ans)
     * @param {Field} publicAffirmationHash - Hash public de l'affirmation
     * @param {Field} birthDateTimestamp - Timestamp UNIX de la date de naissance
     * @param {Field} currentTimestamp - Timestamp UNIX actuel
     * @returns {Bool} - True si la personne est majeure
     */
    verifyMajority: {
      privateInputs: [Field, Field],

      method(publicAffirmationHash, birthDateTimestamp, currentTimestamp) {
        // Créer une vérification d'âge avec 18 ans comme âge minimum
        const ageVerification = new AgeVerification({
          birthDateTimestamp,
          currentTimestamp,
          minimumAge: Field(18)
        });

        // Vérifier l'âge
        return ageVerification.hasMinimumAge();
      }
    },

    /**
     * Vérifie si une adresse est située en France
     * @param {Field} publicAffirmationHash - Hash public de l'affirmation
     * @param {CircuitString} addressText - Texte de l'adresse à vérifier
     * @returns {Bool} - True si l'adresse est en France
     */
    verifyFrenchAddress: {
      privateInputs: [CircuitString],

      method(publicAffirmationHash, addressText) {
        // Convertir l'adresse en minuscules et la normaliser
        // Note: la normalisation complète nécessiterait des comparaisons plus complexes que celles fournies ici

        // Vérifier si l'adresse contient "france"
        const containsFrance = addressText.toString().toLowerCase().includes("france");

        // Vérifier si le code postal commence par un chiffre entre 0 et 9
        // Ceci est simplifié - en réalité, il faudrait vérifier si c'est un code postal français valide
        const hasValidPostalCode = Provable.witness(Bool, () => {
          const postalCodeRegex = /\b\d{5}\b/;
          return Bool(postalCodeRegex.test(addressText.toString()));
        });

        // Retourner true si l'adresse contient "france" et a un code postal valide
        return Bool(containsFrance).and(hasValidPostalCode);
      }
    },

    /**
     * Composition de preuves: vérifie une preuve existante
     * @param {Field} publicAffirmationHash - Hash public de l'affirmation
     * @param {SelfProof} previousProof - Preuve précédente
     * @returns {Bool} - Résultat de la vérification précédente
     */
    verifyProof: {
      privateInputs: [SelfProof],

      method(publicAffirmationHash, previousProof) {
        // Vérifier que la preuve précédente est valide pour le même hash public
        previousProof.publicInput.assertEquals(publicAffirmationHash);

        // Retourner le résultat de la vérification précédente
        return previousProof.publicOutput;
      }
    }
  }
});

/**
 * Exporter la preuve du programme ZK
 */
export class AffirmationProof extends ZkProgram.Proof(AffirmationVerifierProgram) {}

/**
 * Classe principale pour la vérification des affirmations juridiques
 */
export class ContractAffirmationVerifier {
  /**
   * Initialise le contrat avec le circuit ZK
   */
  constructor() {
    this.program = AffirmationVerifierProgram;
  }

  /**
   * Compile le circuit pour générer des preuves
   */
  static async compile() {
    console.log('Compilation du circuit ZKP...');
    await AffirmationVerifierProgram.compile();
    console.log('Compilation terminée');
  }

  /**
   * Vérifie une affirmation et génère une preuve ZKP
   * @param {Field} publicAffirmationHash - Hash public de l'affirmation
   * @param {Affirmation} affirmation - L'affirmation à vérifier
   * @returns {Promise<AffirmationProof>} - Preuve ZKP
   */
  static async verifyAffirmation(publicAffirmationHash, affirmation) {
    console.log('Génération de la preuve ZKP pour l\'affirmation...');
    const proof = await AffirmationVerifierProgram.verifyAffirmation(
      publicAffirmationHash,
      affirmation
    );
    console.log('Preuve générée avec succès');
    return proof;
  }

  /**
   * Vérifie si une personne est majeure et génère une preuve ZKP
   * @param {Field} publicAffirmationHash - Hash public de l'affirmation
   * @param {number} birthDate - Date de naissance au format timestamp UNIX
   * @param {number} currentDate - Date actuelle au format timestamp UNIX
   * @returns {Promise<AffirmationProof>} - Preuve ZKP
   */
  static async verifyMajority(publicAffirmationHash, birthDate, currentDate) {
    console.log('Génération de la preuve ZKP pour la majorité...');
    const proof = await AffirmationVerifierProgram.verifyMajority(
      publicAffirmationHash,
      Field(birthDate),
      Field(currentDate)
    );
    console.log('Preuve générée avec succès');
    return proof;
  }

  /**
   * Vérifie si une adresse est en France et génère une preuve ZKP
   * @param {Field} publicAffirmationHash - Hash public de l'affirmation
   * @param {string} address - Adresse à vérifier
   * @returns {Promise<AffirmationProof>} - Preuve ZKP
   */
  static async verifyFrenchAddress(publicAffirmationHash, address) {
    console.log('Génération de la preuve ZKP pour l\'adresse française...');
    const addressText = CircuitString.fromString(address.substring(0, 30)); // Limite de taille pour CircuitString
    const proof = await AffirmationVerifierProgram.verifyFrenchAddress(
      publicAffirmationHash,
      addressText
    );
    console.log('Preuve générée avec succès');
    return proof;
  }
}

// Exporter les classes et fonctions nécessaires
export { MerkleTree, AffirmationWitness };