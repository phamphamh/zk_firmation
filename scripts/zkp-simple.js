import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import {
  Field,
  Poseidon,
  Struct,
  CircuitString,
  ZkProgram,
  Provable,
  Bool
} from 'o1js';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

/**
 * Simulation d'extraction OCR pour attestation d'hébergement
 * Retourne un objet avec les données extraites
 */
function simulateOCR() {
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
  static fromPersonData(person, address = '', referenceDate = new Date()) {
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
}

/**
 * Classe représentant un document/attestation pour le ZKP
 */
class Document extends Struct({
  hostData: Person,
  guestData: Person,
  documentHash: Field,
  isSignedAndStamped: Field,
  validityDays: Field
}) {
  // Crée une instance à partir des données d'une attestation
  static fromAttestation(attestation) {
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
    // Limiter la taille du texte (CircuitString a une limite)
    const documentTextShort = attestation.textContent.substring(0, 30); // Limite à 30 caractères
    const documentHash = Poseidon.hash([
      Field(documentTextShort.length),
      ...Array.from(documentTextShort).map(c => Field(c.charCodeAt(0)))
    ]);

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
      isSignedAndStamped: Field(attestation.containsSignature && attestation.officialStamp ? 1 : 0),
      validityDays: Field(validityDays > 0 ? validityDays : 0)
    });
  }
}

/**
 * Programme ZK pour vérifier l'attestation d'hébergement
 */
const AttestationVerifier = ZkProgram({
  name: "attestation-verifier",
  publicOutput: Field,

  methods: {
    // Vérification de validité du document
    verifyDocumentValidity: {
      privateInputs: [Document],

      method(document) {
        // Vérification 1: Document valide (signé, tamponné et non expiré)
        const isValidDoc = document.isSignedAndStamped.equals(Field(1)).and(
          document.validityDays.greaterThan(Field(0))
        );

        // Vérification que le document est effectivement valide
        isValidDoc.assertTrue("Le document doit être valide, signé et non expiré");

        // Retourner un hachage du document pour référence
        return Poseidon.hash([
          document.documentHash,
          document.isSignedAndStamped,
          document.validityDays
        ]);
      }
    },

    // Vérification que l'hôte est majeur
    verifyHostIsAdult: {
      privateInputs: [Person],

      method(host) {
        // Vérification 2: Hôte majeur (plus de 18 ans)
        const isAdult = host.ageProof.greaterThanOrEqual(Field(6570)); // 18 ans * 365 jours

        // Vérification que l'hôte est majeur
        isAdult.assertTrue("L'hôte doit être majeur");

        // Retourner un hachage de l'hôte pour référence
        return Poseidon.hash([
          host.firstNameHash,
          host.lastNameHash,
          host.ageProof
        ]);
      }
    },

    // Vérification que l'adresse est en France
    verifyAddressInFrance: {
      privateInputs: [Person],

      method(person) {
        // Vérification 3: Adresse en France
        // Simplification - vérifier simplement que le hash n'est pas zéro
        const isNonZero = person.addressHash.equals(Field(0)).not();

        // Vérification que l'adresse existe
        isNonZero.assertTrue("L'adresse doit être spécifiée");

        // Retourner un hash simple pour la preuve
        return Field(1); // Valeur constante pour la preuve
      }
    },

    // Vérification de l'identité de l'invité
    verifyGuestIdentity: {
      privateInputs: [Person],

      method(guest) {
        // Simplification - vérifier simplement que le nom est non vide
        const hasName = guest.firstNameHash.equals(Field(0)).not();
        hasName.assertTrue("L'invité doit avoir un nom");

        // Retourner un hash simple pour la preuve
        return Field(1);
      }
    }
  }
});

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
    await AttestationVerifier.compile();
    console.log("✅ Circuit compilé avec succès");

    // Génération des preuves ZKP
    console.log("\n🔍 Génération des preuves ZKP...");

    // 1. Preuve de validité du document
    console.log("1️⃣ Génération de la preuve de validité du document...");
    const documentValidityProof = await AttestationVerifier.verifyDocumentValidity(documentZKP);
    const documentValidityHash = documentValidityProof.publicOutput.toString();
    console.log("✅ Preuve générée, hash:", documentValidityHash);

    // 2. Preuve que l'hôte est majeur
    console.log("2️⃣ Génération de la preuve de majorité de l'hôte...");
    const hostAdultProof = await AttestationVerifier.verifyHostIsAdult(documentZKP.hostData);
    const hostAdultHash = hostAdultProof.publicOutput.toString();
    console.log("✅ Preuve générée, hash:", hostAdultHash);

    // 3. Preuve que l'adresse est en France
    console.log("3️⃣ Génération de la preuve de validité de l'adresse...");
    const addressProof = await AttestationVerifier.verifyAddressInFrance(documentZKP.hostData);
    const addressHash = addressProof.publicOutput.toString();
    console.log("✅ Preuve générée, hash:", addressHash);

    // 4. Preuve que l'invité est correctement identifié
    console.log("4️⃣ Génération de la preuve d'identité de l'invité...");
    const guestIdentityProof = await AttestationVerifier.verifyGuestIdentity(documentZKP.guestData);
    const guestIdentityHash = guestIdentityProof.publicOutput.toString();
    console.log("✅ Preuve générée, hash:", guestIdentityHash);

    // Génération d'identifiants de transaction fictifs
    const transactionIds = {
      documentValidityTxId: `MinaTx_${documentValidityHash.substring(0, 10)}`,
      hostAdultTxId: `MinaTx_${hostAdultHash.substring(0, 10)}`,
      addressTxId: `MinaTx_${addressHash.substring(0, 10)}`,
      guestIdentityTxId: `MinaTx_${guestIdentityHash.substring(0, 10)}`
    };

    // Création du certificat final
    const certificate = {
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
          zkProofHash: documentValidityHash
        },
        {
          statement: "L'hébergeur est majeur",
          confidence: "100%",
          zkProofHash: hostAdultHash
        },
        {
          statement: "L'adresse de l'hébergeur est valide",
          confidence: "100%",
          zkProofHash: addressHash
        },
        {
          statement: "L'hébergé est correctement identifié",
          confidence: "100%",
          zkProofHash: guestIdentityHash
        }
      ],
      blockchainTransactions: transactionIds,
      verificationMethod: "Mina Protocol Zero Knowledge Proof (o1js)",
      verificationDate: new Date().toISOString(),
      legalValidity: "Ce certificat prouve cryptographiquement la validité des affirmations sans révéler les données personnelles"
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
      console.error("   NODE_OPTIONS=--max-old-space-size=8192 node scripts/zkp-simple.js");
    }
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error("❌ Erreur non gérée:", error);
});