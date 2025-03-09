import { useState } from 'react';
import Head from 'next/head';
import DocumentUploader from '@/components/DocumentUploader';
import { MistralOCRService } from '@/services/ocr/mistralOCR';
import { MinaZKPService } from '@/services/zkp/minaService';
import { AIJudgeService } from '@/services/ai/aiJudgeService';
import { CertificateService } from '@/services/pdf/certificateService';

// Types pour le processus de vérification
interface ProcessStep {
  id: number;
  name: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export default function VerifyPage() {
  // État pour le processus de vérification
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 1, name: 'Soumettre un document', status: 'waiting' },
    { id: 2, name: 'Extraction de texte', status: 'waiting' },
    { id: 3, name: 'Vérification ZKP', status: 'waiting' },
    { id: 4, name: 'Validation AI', status: 'waiting' },
    { id: 5, name: 'Génération du certificat', status: 'waiting' }
  ]);

  // État pour le document soumis
  const [document, setDocument] = useState<File | null>(null);

  // État pour l'affirmation à vérifier
  const [assertion, setAssertion] = useState<string>('');

  // État pour le certificat généré
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  // Fonction pour mettre à jour l'état d'une étape
  const updateStepStatus = (stepId: number, status: ProcessStep['status'], result?: any, error?: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, status, result, error }
          : step
      )
    );
  };

  // Fonction pour gérer la soumission du document
  const handleDocumentUpload = async (file: File) => {
    try {
      // Mettre à jour l'état du document
      setDocument(file);
      updateStepStatus(1, 'completed', { filename: file.name });

      // Passer à l'étape suivante (extraction de texte)
      updateStepStatus(2, 'processing');

      // Simuler l'extraction OCR (en prod, utilisez une véritable API)
      setTimeout(() => {
        // En réalité, vous utiliseriez quelque chose comme:
        // const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || '';
        // const ocrService = new MistralOCRService(apiKey);
        // const result = await ocrService.extractText(file);

        // Simuler un résultat d'extraction
        const simulatedResult = {
          text: "Contrat de vente entre Partie A et Partie B. Le bien immobilier situé au 123 Rue Exemple est vendu pour la somme de 250 000 €. Date: 15/10/2023. Signatures: [Signature A] [Signature B]",
          confidence: 0.92,
          success: true
        };

        updateStepStatus(2, 'completed', simulatedResult);

        // Passer à l'étape suivante (vérification ZKP)
        processZKPVerification(simulatedResult.text);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      updateStepStatus(1, 'error', null, error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  // Fonction pour gérer la vérification ZKP
  const processZKPVerification = (extractedText: string) => {
    updateStepStatus(3, 'processing');

    // Simuler la vérification ZKP
    setTimeout(() => {
      // En réalité, vous utiliseriez quelque chose comme:
      // const zkpService = new MinaZKPService();
      // const result = await zkpService.generateAssertionProof(extractedText, assertion);

      // Simuler un résultat de vérification ZKP
      const simulatedResult = {
        success: true,
        proof: {
          publicInput: 'simulated-hash-value',
          assertion: assertion || 'Le contrat est valide et signé par toutes les parties.',
          type: 'mock-assertion-proof',
          txId: 'mock-transaction-id-' + Date.now()
        }
      };

      updateStepStatus(3, 'completed', simulatedResult);

      // Passer à l'étape suivante (validation AI)
      processAIValidation(extractedText, assertion || 'Le contrat est valide et signé par toutes les parties.');
    }, 3000);
  };

  // Fonction pour gérer la validation AI
  const processAIValidation = (extractedText: string, assertion: string) => {
    updateStepStatus(4, 'processing');

    // Simuler la validation AI
    setTimeout(() => {
      // En réalité, vous utiliseriez quelque chose comme:
      // const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || '';
      // const aiService = new AIJudgeService(apiKey);
      // const result = await aiService.verifyAssertion(extractedText, assertion);

      // Simuler un résultat de validation AI
      const simulatedResult = {
        assertion,
        isValid: true,
        confidence: 0.89,
        explanation: "Le contrat contient bien toutes les signatures requises des parties A et B, ainsi que la date du 15/10/2023. Le prix de vente et l'adresse du bien sont clairement spécifiés."
      };

      updateStepStatus(4, 'completed', simulatedResult);

      // Passer à l'étape finale (génération du certificat)
      generateCertificate(extractedText, [simulatedResult], steps[2].result?.proof?.txId);
    }, 3000);
  };

  // Fonction pour générer le certificat
  const generateCertificate = (extractedText: string, assertions: any[], zkpProofId?: string) => {
    updateStepStatus(5, 'processing');

    // Simuler la génération du certificat
    setTimeout(() => {
      // En réalité, vous utiliseriez quelque chose comme:
      // const certificateService = new CertificateService();
      // const data = {
      //   contractFilename: document?.name || 'document.pdf',
      //   extractionDate: new Date(),
      //   assertions,
      //   zkpProofId,
      //   aiJudgeName: 'Mistral AI Judge',
      //   userSignature: 'Utilisateur'
      // };
      // const result = await certificateService.generateCertificate(data);

      // Simuler un résultat de génération de certificat
      const simulatedResult = {
        success: true,
        // Dans une application réelle, vous utiliseriez les bytes du PDF pour créer un URL
        pdfUrl: '#' // URL du certificat généré
      };

      updateStepStatus(5, 'completed', simulatedResult);

      // Définir l'URL du certificat (dans une application réelle, ce serait un Blob URL)
      setCertificateUrl('#');
    }, 3000);
  };

  // Fonction pour rédemarrer le processus
  const resetProcess = () => {
    setDocument(null);
    setAssertion('');
    setCertificateUrl(null);
    setSteps([
      { id: 1, name: 'Soumettre un document', status: 'waiting' },
      { id: 2, name: 'Extraction de texte', status: 'waiting' },
      { id: 3, name: 'Vérification ZKP', status: 'waiting' },
      { id: 4, name: 'Validation AI', status: 'waiting' },
      { id: 5, name: 'Génération du certificat', status: 'waiting' }
    ]);
  };

  return (
    <>
      <Head>
        <title>Vérification de Document | ZK-Firmation</title>
        <meta name="description" content="Vérifiez l'authenticité de vos documents juridiques" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <header className="bg-primary-700 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">ZK-Firmation</h1>
            <p className="text-sm">Vérification juridique sécurisée et confidentielle</p>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4">
          <h2 className="text-3xl font-bold mb-6">Vérification de Document</h2>

          <div className="mb-8 bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-6">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center
                              ${step.status === 'waiting' ? 'bg-gray-200' :
                                step.status === 'processing' ? 'bg-blue-500 text-white' :
                                step.status === 'completed' ? 'bg-green-500 text-white' :
                                'bg-red-500 text-white'}`}
                  >
                    {step.status === 'processing' ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className="text-sm mt-2 text-center">{step.name}</p>
                </div>
              ))}
            </div>

            {steps[0].status === 'waiting' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Soumettre un Document</h3>
                <DocumentUploader onUpload={handleDocumentUpload} />
              </div>
            )}

            {steps[0].status === 'completed' && steps[1].status === 'waiting' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Document Soumis</h3>
                <p>Votre document <strong>{document?.name}</strong> a été soumis avec succès.</p>
                <p className="mt-4">Nous allons maintenant procéder à l'extraction du texte...</p>
              </div>
            )}

            {steps[1].status === 'completed' && steps[2].status === 'waiting' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Extraction de Texte Complétée</h3>
                <p className="mb-4">Le texte a été extrait avec une confiance de <strong>{Math.round((steps[1].result?.confidence || 0) * 100)}%</strong>.</p>

                <div className="mb-4">
                  <label htmlFor="assertion" className="block text-sm font-medium text-gray-700 mb-1">
                    Affirmation à vérifier:
                  </label>
                  <input
                    type="text"
                    id="assertion"
                    value={assertion}
                    onChange={(e) => setAssertion(e.target.value)}
                    placeholder="Ex: Le contrat est valide et signé par toutes les parties"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <button
                  onClick={() => processZKPVerification(steps[1].result?.text || '')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Poursuivre avec la Vérification ZKP
                </button>
              </div>
            )}

            {steps[2].status === 'completed' && steps[3].status === 'waiting' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Vérification ZKP Complétée</h3>
                <p>La preuve ZKP a été générée avec succès.</p>
                <p className="mt-2">ID de transaction: <code>{steps[2].result?.proof?.txId}</code></p>
                <p className="mt-4">Nous allons maintenant procéder à la validation par l'IA...</p>
              </div>
            )}

            {steps[3].status === 'completed' && steps[4].status === 'waiting' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Validation AI Complétée</h3>
                <p className="mb-2">Résultat:</p>
                <div className={`p-3 rounded-lg ${steps[3].result?.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p className="font-bold">
                    {steps[3].result?.isValid ? 'VALIDE' : 'NON VALIDE'}
                    (Confiance: {Math.round((steps[3].result?.confidence || 0) * 100)}%)
                  </p>
                  <p className="mt-2">{steps[3].result?.explanation}</p>
                </div>
                <button
                  onClick={() => generateCertificate(
                    steps[1].result?.text || '',
                    [steps[3].result],
                    steps[2].result?.proof?.txId
                  )}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Générer le Certificat
                </button>
              </div>
            )}

            {steps[4].status === 'completed' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Certificat Généré</h3>
                <p className="mb-4">Votre certificat de vérification a été généré avec succès.</p>
                <div className="flex justify-center">
                  <a
                    href={certificateUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Télécharger le Certificat
                  </a>
                </div>
                <div className="text-center mt-6">
                  <button
                    onClick={resetProcess}
                    className="text-primary-600 underline"
                  >
                    Vérifier un autre document
                  </button>
                </div>
              </div>
            )}

            {/* Affichage des erreurs */}
            {steps.some(step => step.status === 'error') && (
              <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg">
                <h3 className="font-bold mb-2">Une erreur est survenue</h3>
                <p>
                  {steps.find(step => step.status === 'error')?.error ||
                    'Une erreur inattendue est survenue lors du processus de vérification.'}
                </p>
                <button
                  onClick={resetProcess}
                  className="mt-4 text-red-800 underline"
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-gray-800 text-white p-4">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} ZK-Firmation. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}