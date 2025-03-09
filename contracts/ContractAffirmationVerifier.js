import {
  Field,
  ZkProgram,
  CircuitString,
  Poseidon,
  Bool,
  Struct
} from 'o1js';

/**
 * Structure représentant une affirmation à vérifier
 */
export class Affirmation extends Struct({
  text: CircuitString, // Le texte de l'affirmation
  documentHash: Field, // Le hash du document sur lequel porte l'affirmation
  isValid: Bool        // Indique si l'affirmation est valide selon les vérifications
}) {
  /**
   * Crée une affirmation à partir de chaînes de caractères
   */
  static fromStrings(affirmationText, documentText, isValid) {
    const affirmationCircuit = CircuitString.fromString(affirmationText);
    const documentHash = Poseidon.hash(CircuitString.fromString(documentText).toFields());

    return new Affirmation({
      text: affirmationCircuit,
      documentHash,
      isValid: new Bool(isValid)
    });
  }

  /**
   * Calcule le hash de l'affirmation
   */
  hash() {
    return Poseidon.hash([
      ...this.text.toFields(),
      this.documentHash,
      this.isValid.toField()
    ]);
  }
}

/**
 * Un programme ZK pour vérifier des affirmations sur des documents juridiques
 */
export const ContractAffirmationVerifier = ZkProgram({
  name: 'ContractAffirmationVerifier',

  // L'entrée publique est le hash de l'affirmation validée
  publicInput: Field,

  methods: {
    /**
     * Vérifie qu'une affirmation est valide selon un texte de document
     */
    verifyAffirmation: {
      privateInputs: [Affirmation],

      method(publicAffirmationHash, affirmation) {
        // Calculer le hash de l'affirmation et vérifier qu'il correspond au hash public
        const computedHash = affirmation.hash();
        computedHash.assertEquals(publicAffirmationHash);

        // Vérifier que l'affirmation est marquée comme valide
        affirmation.isValid.assertEquals(Bool(true));

        // Note: Dans une implémentation réelle, on aurait ici une logique plus complexe
        // qui analyserait le document et l'affirmation pour déterminer sa validité
        // au lieu de se fier à un flag préétabli
      }
    },

    /**
     * Vérifie qu'une personne est majeure selon sa date de naissance
     */
    verifyMajority: {
      privateInputs: [CircuitString, Field, Field],

      method(publicAffirmationHash, documentText, birthDateTimestamp, currentTimestamp) {
        // Convertir le texte du document en hash
        const documentHash = Poseidon.hash(documentText.toFields());

        // Calculer l'âge en secondes
        const ageInSeconds = currentTimestamp.sub(birthDateTimestamp);

        // Vérifier que l'âge est supérieur à 18 ans en secondes (approximativement)
        // 18 ans = 18 * 365,25 * 24 * 60 * 60 = 567648000 secondes
        const isAdult = ageInSeconds.gte(Field(567648000));

        // Construire l'affirmation "La personne est majeure"
        const affirmationText = CircuitString.fromString("La personne est majeure");

        // Construire et hasher l'affirmation
        const affirmation = new Affirmation({
          text: affirmationText,
          documentHash,
          isValid: Bool(isAdult)
        });

        // Vérifier que le hash correspond au hash public
        const computedHash = affirmation.hash();
        computedHash.assertEquals(publicAffirmationHash);
      }
    },

    /**
     * Vérifie qu'une adresse est située en France
     */
    verifyFrenchAddress: {
      privateInputs: [CircuitString, CircuitString],

      method(publicAffirmationHash, documentText, addressText) {
        // Convertir le texte du document en hash
        const documentHash = Poseidon.hash(documentText.toFields());

        // Nous ne pouvons pas faire de recherche de sous-chaîne directement dans un circuit,
        // donc cette fonction simule une vérification que l'adresse contient "France"
        // En pratique, cette vérification serait faite hors-circuit, puis le résultat
        // serait transmis au circuit comme une entrée

        // Simuler un résultat pour la démonstration
        const isInFrance = Bool(true); // Supposons que l'adresse est en France

        // Construire l'affirmation
        const affirmation = new Affirmation({
          text: CircuitString.fromString("L'adresse est située en France"),
          documentHash,
          isValid: isInFrance
        });

        // Vérifier le hash
        const computedHash = affirmation.hash();
        computedHash.assertEquals(publicAffirmationHash);
      }
    }
  }
});

/**
 * Exporte le type de preuve généré par ce programme ZK
 */
export const AffirmationProof = ContractAffirmationVerifier.Proof;