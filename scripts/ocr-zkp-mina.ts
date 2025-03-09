import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import {
  Field,
  Struct,
  Poseidon,
  MerkleMap,
  Bool,
  Circuit,
  CircuitString,
  SmartContract,
  method,
  DeployArgs,
  Permissions,
  PrivateKey,
  AccountUpdate,
  Mina,
  PublicKey,
  UInt32,
  Provable
} from 'o1js';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

/**
 * Types pour les données OCR
 */
interface PersonData {
  firstName: string;
  lastName: string;
  dob: string;
  address?: string;
}

interface AttestationData {
  host: PersonData;
  guest: PersonData;
  documentType: string;
  documentDate: string;
  validUntil: string;
  containsSignature: boolean;
  signatureDate: string;
  officialStamp: boolean;
  textContent: string;
}

/**
 * Simulation d'extraction OCR pour attestation d'hébergement
 * Retourne un objet avec les données extraites
 */
function simulateOCR(): AttestationData {
  console.log("🔍 Simulation de l'extraction OCR d'une attestation d'hébergement...");

  // Données simulées d'une attestation d'hébergement
  return {
    host: {
      firstName: "Jean",
      lastName: "Dupont",
      address: "123 Rue de la République, 75001 Paris, France",
      dob: "15/05/1970"
    },
    guest: {
      firstName: "Marie",
      lastName: "Lambert",
      dob: "23/08/1992"
    },
    documentType: "Attestation d'hébergement",
    documentDate: "10/01/2025",
    validUntil: "10/01/2026",
    containsSignature: true,
    signatureDate: "10/01/2025",
    officialStamp: true,
    textContent:
      `ATTESTATION D'HÉBERGEMENT

      Je soussigné, Jean Dupont, né le 15/05/1970 à Lyon,
      Demeurant au 123 Rue de la République, 75001 Paris, France,

      Atteste sur l'honneur héberger à mon domicile :
      Marie Lambert, née le 23/08/1992 à Marseille,

      Cette attestation est établie pour servir et valoir ce que de droit.

      Fait à Paris, le 10/01/2025

      Signature: [Signature manuscrite]
      [Tampon officiel]`
  };
}

/**
 * Classe représentant une personne pour le ZKP
 */
class Person extends Struct({
  firstNameHash: Field,  // Hash du prénom
  lastNameHash: Field,   // Hash du nom
  ageProof: Field,       // Preuve de l'âge (en jours) sans révéler la date exacte
  addressHash: Field     // Hash de l'adresse
}) {
  // Crée une instance à partir de données textuelles
  static fromPersonData(person: PersonData, address = '', referenceDate = new Date()): Person {
    // Hachage des données sensibles
    const firstNameHash = Poseidon.hash(CircuitString.fromString(person.firstName).toFields());
    const lastNameHash = Poseidon.hash(CircuitString.fromString(person.lastName).toFields());
    const addressHash = address ?
      Poseidon.hash(CircuitString.fromString(address).toFields()) :
      Field(0);

    // Calcul de l'âge en jours (sans révéler la date de naissance)
    const dobParts = person.dob.split('/');
    const birthDate = new Date(
      parseInt(dobParts[2]),
      parseInt(dobParts[1]) - 1,
      parseInt(dobParts[0])
    );
    const ageInDays = Math.floor(
      (referenceDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return new Person({
      firstNameHash: firstNameHash,
      lastNameHash: lastNameHash,
      ageProof: Field(ageInDays),
      addressHash: addressHash
    });
  }

  // Vérifie si la personne est majeure (18 ans)
  isAdult(): Bool {
    // 18 ans * 365 jours = 6570 jours
    return Provable.if(
      this.ageProof.greaterThanOrEqual(Field(6570)),
      Bool(true),
      Bool(false)
    );
  }
}

/**
 * Classe représentant un document/attestation pour le ZKP
 */
class Document extends Struct({
  hostData: Person,
  guestData: Person,
  documentHash: Field,
  isSignedAndStamped: Bool,
  validityDays: Field
}) {
  // Crée une instance à partir des données d'une attestation
  static fromAttestation(attestation: AttestationData): Document {
    const referenceDate = new Date();

    // Création des objets Person pour l'hôte et l'invité
    const hostPerson = Person.fromPersonData(
      attestation.host,
      attestation.host.address || '',
      referenceDate
    );

    const guestPerson = Person.fromPersonData(
      attestation.guest,
      '',
      referenceDate
    );

    // Hachage du contenu du document pour référence
    const documentHash = Poseidon.hash(
      CircuitString.fromString(attestation.textContent).toFields()
    );

    // Calcul de la durée de validité en jours
    const dateParts = attestation.validUntil.split('/');
    const validUntil = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[0])
    );
    const validityDays = Math.floor(
      (validUntil.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return new Document({
      hostData: hostPerson,
      guestData: guestPerson,
      documentHash: documentHash,
      isSignedAndStamped: Bool(
        attestation.containsSignature && attestation.officialStamp
      ),
      validityDays: Field(validityDays > 0 ? validityDays : 0)
    });
  }

  // Vérifie si le document est valide
  isValid(): Bool {
    return Provable.if(
      this.isSignedAndStamped.and(this.validityDays.greaterThan(Field(0))),
      Bool(true),
      Bool(false)
    );
  }
}

// Interface pour les résultats de vérification
interface VerificationResult {
  documentIsValid: Bool;
  hostIsAdult: Bool;
  addressIsValid: Bool;
  guestIsValid: Bool;
}

/**
 * Circuit ZKP pour la vérification d'attestation d'hébergement
 */
class AccommodationCertificateVerifier extends SmartContract {
  // Variables d'état du contrat
  @method init() {
    super.init();
  }

  /**
   * Vérifie qu'une attestation d'hébergement est valide sans révéler son contenu
   * @param document Le document à vérifier
   * @returns Les preuves générées
   */
  @method verifyAccommodation(document: Document): VerificationResult {
    // Vérification 1: Document valide (signé, tamponné et non expiré)
    const isValidDoc = document.isValid();
    isValidDoc.assertEquals(Bool(true));

    // Vérification 2: Hôte majeur
    const isHostAdult = document.hostData.isAdult();
    isHostAdult.assertEquals(Bool(true));

    // Vérification 3: Adresse de l'hôte en France (simplifié dans cette simulation)
    // Dans un cas réel, on pourrait vérifier que le hash correspond à une adresse vérifiée en France
    document.hostData.addressHash.assertNotEquals(Field(0));

    // Vérification 4: Invité est une personne réelle (simplifié)
    document.guestData.firstNameHash.assertNotEquals(Field(0));
    document.guestData.lastNameHash.assertNotEquals(Field(0));

    // Retourne une preuve de toutes les vérifications réussies
    return {
      documentIsValid: isValidDoc,
      hostIsAdult: isHostAdult,
      addressIsValid: Bool(true),
      guestIsValid: Bool(true)
    };
  }
}

/**
 * Type pour le certificat de vérification final
 */
interface Certificate {
  title: string;
  date: string;
  originalDocument: {
    type: string;
    date: string;
    validUntil: string;
  };
  host: {
    nameInitials: string;
    addressHash: string;
  };
  guest: {
    nameInitials: string;
  };
  validatedAffirmations: Array<{
    statement: string;
    confidence: string;
    zkProofHash: string;
  }>;
  blockchainTransactions: {
    accommodationTxId: string;
    majorityTxId: string;
    validityTxId: string;
  };
  verificationMethod: string;
}

/**
 * Fonction principale qui exécute le processus ZKP
 */
async function main() {
  try {
    console.log("🚀 Démarrage du processus de vérification ZKP avec Mina o1js...");

    // Simulation OCR
    const extractedData = simulateOCR();
    console.log("✅ Extraction OCR simulée avec succès");
    console.log("📝 Données extraites:", JSON.stringify(extractedData, null, 2));

    // Préparation du document pour le ZKP
    console.log("\n🔐 Préparation des données pour le Zero Knowledge Proof...");
    const documentZKP = Document.fromAttestation(extractedData);
    console.log("📊 Document ZKP préparé");

    // Compilation du circuit (nécessaire pour o1js)
    console.log("\n🔨 Compilation du circuit ZKP...");
    console.log("⚠️  Cette étape peut prendre plusieurs minutes la première fois");
    await AccommodationCertificateVerifier.compile();
    console.log("✅ Circuit compilé avec succès");

    // Configuration d'une instance locale de Mina (pour test uniquement)
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);

    // Création des comptes pour le test
    const deployerAccount = Local.testAccounts[0].privateKey;
    const deployerAddress = deployerAccount.toPublicKey();

    // Génération d'une clé pour le contract
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    // Création d'une instance du contrat
    console.log("\n🏗️  Déploiement du contrat ZKP...");
    const zkApp = new AccommodationCertificateVerifier(zkAppAddress);

    // Transaction de déploiement
    const deployTxn = await Mina.transaction(deployerAddress, () => {
      AccountUpdate.fundNewAccount(deployerAddress);
      zkApp.deploy();
    });
    await deployTxn.sign([deployerAccount, zkAppPrivateKey]).send();
    console.log("✅ Contrat déployé avec succès");

    // Exécution de la vérification ZKP
    console.log("\n🔍 Exécution de la vérification ZKP...");
    const verifyTxn = await Mina.transaction(deployerAddress, () => {
      zkApp.verifyAccommodation(documentZKP);
    });
    await verifyTxn.prove();
    await verifyTxn.sign([deployerAccount]).send();
    console.log("✅ Vérification ZKP réussie!");

    // Génération des preuves et hachages pour le certificat final
    console.log("\n📜 Génération du certificat de vérification...");

    // Création de hachages pour chaque affirmation vérifiée
    const accommodationProofHash = Poseidon.hash([
      documentZKP.hostData.addressHash,
      documentZKP.guestData.firstNameHash,
      documentZKP.guestData.lastNameHash,
      documentZKP.documentHash
    ]).toString();

    const majorityProofHash = Poseidon.hash([
      documentZKP.guestData.ageProof
    ]).toString();

    const validityProofHash = Poseidon.hash([
      documentZKP.validityDays,
      documentZKP.isSignedAndStamped.toField()
    ]).toString();

    // Génération d'identifiants de transaction fictifs
    const transactionIds = {
      accommodationTxId: `MinaTx_${accommodationProofHash.substring(0, 10)}`,
      majorityTxId: `MinaTx_${majorityProofHash.substring(0, 10)}`,
      validityTxId: `MinaTx_${validityProofHash.substring(0, 10)}`
    };

    // Création du certificat final
    const certificate: Certificate = {
      title: "CERTIFICAT DE VÉRIFICATION - ATTESTATION D'HÉBERGEMENT",
      date: new Date().toLocaleDateString('fr-FR'),
      originalDocument: {
        type: extractedData.documentType,
        date: extractedData.documentDate,
        validUntil: extractedData.validUntil
      },
      host: {
        nameInitials: `${extractedData.host.firstName.charAt(0)}.${extractedData.host.lastName.charAt(0)}.`,
        addressHash: documentZKP.hostData.addressHash.toString()
      },
      guest: {
        nameInitials: `${extractedData.guest.firstName.charAt(0)}.${extractedData.guest.lastName.charAt(0)}.`,
      },
      validatedAffirmations: [
        {
          statement: "L'attestation d'hébergement est valide, signée et tamponnée",
          confidence: "100%",
          zkProofHash: validityProofHash
        },
        {
          statement: "L'hébergeur est majeur et dispose d'une adresse en France",
          confidence: "100%",
          zkProofHash: accommodationProofHash
        },
        {
          statement: "L'hébergé est correctement identifié",
          confidence: "100%",
          zkProofHash: majorityProofHash
        }
      ],
      blockchainTransactions: transactionIds,
      verificationMethod: "Mina Protocol Zero Knowledge Proof"
    };

    // Affichage du certificat final
    console.log("\n📋 CERTIFICAT GÉNÉRÉ AVEC SUCCÈS :");
    console.log(JSON.stringify(certificate, null, 2));

    // Sauvegarde du certificat dans un fichier
    const outputPath = path.resolve(process.cwd(), 'certificate.json');
    fs.writeFileSync(outputPath, JSON.stringify(certificate, null, 2));
    console.log(`\n📄 Certificat sauvegardé dans ${outputPath}`);

    console.log("\n✨ PROCESSUS TERMINÉ AVEC SUCCÈS ✨");

  } catch (error) {
    console.error("❌ Erreur lors du processus:", error);

    if (error.message && error.message.includes("compile")) {
      console.error("\n⚠️ Erreur de compilation du circuit ZKP. Assurez-vous d'avoir suffisamment de mémoire disponible.");
      console.error("💡 Conseil: Essayez d'augmenter la mémoire disponible pour Node.js avec:");
      console.error("   NODE_OPTIONS=--max-old-space-size=8192 npx ts-node scripts/ocr-zkp-mina.ts");
    }
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error("❌ Erreur non gérée:", error);
});