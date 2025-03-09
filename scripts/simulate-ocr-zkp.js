// Script de simulation du processus OCR-ZKP

// Simuler le texte extrait d'une attestation d'hébergement
const simulatedExtractedText = `
ATTESTATION D'HÉBERGEMENT

Je soussigné(e), M./Mme DUPONT Jean, né(e) le 15/06/1975 à Paris,
demeurant au 123 rue des Lilas, 75020 Paris, France,

Certifie sur l'honneur héberger à mon domicile :

M./Mme MARTIN Sophie, né(e) le 23/09/2000 à Lyon,

depuis le 01/01/2023 et jusqu'à ce jour.

Je m'engage à signaler tout changement concernant cette situation.

Fait à Paris, le 15/02/2023

Signature : [Signature électronique]

Documents joints :
- Copie de ma pièce d'identité
- Justificatif de domicile à mon nom
`;

// Fonction principale
async function simulateProcess() {
  console.log('Début de la simulation du processus OCR-ZKP...');

  // Étape 1: Simuler l'extraction OCR
  console.log('\n--- ÉTAPE 1: EXTRACTION OCR ---');
  console.log('Texte extrait:');
  console.log(simulatedExtractedText);

  // Étape 2: Extraire des informations spécifiques
  console.log('\n--- ÉTAPE 2: EXTRACTION D\'INFORMATIONS ---');

  // Extraire le nom de l'hébergeur
  const hebergeurMatch = simulatedExtractedText.match(/soussigné\(e\), (M\.\/(Mme|M) .+?),/);
  const hebergeur = hebergeurMatch ? hebergeurMatch[1] : 'Non trouvé';
  console.log('Hébergeur:', hebergeur);

  // Extraire l'adresse
  const adresseMatch = simulatedExtractedText.match(/demeurant au (.+?),/);
  const adresse = adresseMatch ? adresseMatch[1] : 'Non trouvé';
  console.log('Adresse:', adresse);

  // Extraire le nom de la personne hébergée
  const hebergeMatch = simulatedExtractedText.match(/héberger à mon domicile :\s+\n\s*(M\.\/(Mme|M) .+?),/);
  const heberge = hebergeMatch ? hebergeMatch[1] : 'Non trouvé';
  console.log('Personne hébergée:', heberge);

  // Extraire la date de naissance de la personne hébergée
  const dateNaissanceMatch = simulatedExtractedText.match(/MARTIN Sophie, né\(e\) le (\d{2}\/\d{2}\/\d{4})/);
  const dateNaissance = dateNaissanceMatch ? dateNaissanceMatch[1] : 'Non trouvé';
  console.log('Date de naissance:', dateNaissance);

  // Étape 3: Vérifier des affirmations
  console.log('\n--- ÉTAPE 3: VÉRIFICATION D\'AFFIRMATIONS ---');

  // Vérifier l'affirmation sur l'hébergement
  const affirmationHebergement = "La personne est hébergée à l'adresse mentionnée dans le document";
  const isHeberge = simulatedExtractedText.includes('héberger à mon domicile');
  console.log(`Affirmation: "${affirmationHebergement}"`);
  console.log(`Résultat: ${isHeberge ? 'VALIDE' : 'NON VALIDE'}`);
  console.log('Explication: Le document indique clairement que la personne est hébergée au domicile mentionné.');

  // Vérifier si la personne est majeure
  const affirmationMajorite = "La personne hébergée est majeure (a plus de 18 ans)";
  let isMajeur = false;

  if (dateNaissanceMatch) {
    const dateNaissanceStr = dateNaissanceMatch[1];
    const [jour, mois, annee] = dateNaissanceStr.split('/').map(Number);
    const dateNaissanceObj = new Date(annee, mois - 1, jour);
    const dateCertificat = new Date(2023, 1, 15); // 15/02/2023

    // Calculer l'âge
    let age = dateCertificat.getFullYear() - dateNaissanceObj.getFullYear();
    const moisDiff = dateCertificat.getMonth() - dateNaissanceObj.getMonth();

    if (moisDiff < 0 || (moisDiff === 0 && dateCertificat.getDate() < dateNaissanceObj.getDate())) {
      age--;
    }

    isMajeur = age >= 18;

    console.log(`Affirmation: "${affirmationMajorite}"`);
    console.log(`Résultat: ${isMajeur ? 'VALIDE' : 'NON VALIDE'}`);
    console.log(`Explication: La personne est née le ${dateNaissanceStr}, ce qui lui donne ${age} ans à la date du document (15/02/2023).`);
  } else {
    console.log(`Affirmation: "${affirmationMajorite}"`);
    console.log('Résultat: IMPOSSIBLE À VÉRIFIER');
    console.log('Explication: La date de naissance n\'a pas pu être extraite du document.');
  }

  // Vérifier si l'adresse est en France
  const affirmationFrance = "L'adresse mentionnée dans ce document est située en France";
  const isFrance = simulatedExtractedText.includes('France');

  console.log(`Affirmation: "${affirmationFrance}"`);
  console.log(`Résultat: ${isFrance ? 'VALIDE' : 'NON VALIDE'}`);
  console.log('Explication: Le document mentionne explicitement que l\'adresse est située en France.');

  // Étape 4: Génération de preuves ZKP
  console.log('\n--- ÉTAPE 4: GÉNÉRATION DE PREUVES ZKP ---');

  // Simuler la génération d'une preuve ZKP pour l'affirmation d'hébergement
  console.log(`Génération de preuve ZKP pour l'affirmation: "${affirmationHebergement}"`);
  const hashContract = `simulated-hash-${Date.now()}`;
  console.log('Hash du contrat:', hashContract);

  // Étape 5: Soumission à la blockchain
  console.log('\n--- ÉTAPE 5: SOUMISSION À LA BLOCKCHAIN ---');
  const txId = `mock-transaction-id-${Date.now()}`;
  console.log('ID de transaction:', txId);

  // Étape 6: Génération du certificat (simulé)
  console.log('\n--- ÉTAPE 6: GÉNÉRATION DU CERTIFICAT ---');
  console.log('Certificat généré avec succès');
  console.log('Le certificat contient:');
  console.log('- Informations du document (nom, date)');
  console.log('- Affirmations validées');
  console.log('- Preuve ZKP (hash et transaction)');
  console.log('- Signatures (AI Judge et système)');

  console.log('\nSimulation terminée avec succès');
}

// Exécuter la simulation
simulateProcess().catch(error => {
  console.error('Erreur lors de la simulation:', error);
});