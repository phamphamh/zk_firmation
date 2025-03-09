import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckCircle, FileDown, FileText, AlertCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ApiService, VerificationRequest } from '@/services/api-service';

export default function VerifyPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [currentStep, setCurrentStep] = useState('');
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer les données de session
    const storedFileData = sessionStorage.getItem('verificationFile');
    const storedQuery = sessionStorage.getItem('verificationQuery');
    const storedCustomData = sessionStorage.getItem('customData');

    if (!storedFileData || !storedQuery) {
      router.replace('/');
      return;
    }

    // Simuler la récupération du fichier (en réalité, nous ne pouvons pas récupérer le fichier de sessionStorage)
    // Dans une application réelle, vous enverriez le fichier via un formulaire ou API
    const mockFile = new File(["dummy content"], JSON.parse(storedFileData).name, {
      type: JSON.parse(storedFileData).type,
      lastModified: JSON.parse(storedFileData).lastModified
    });

    // Créer la requête avec les données personnalisées si disponibles
    const request: VerificationRequest = {
      document: mockFile,
      query: storedQuery,
      customData: storedCustomData ? JSON.parse(storedCustomData) : undefined
    };

    // Traiter le document
    processDocument(request);
  }, [router]);

  const processDocument = async (request: VerificationRequest) => {
    try {
      // Initialiser la progression
      setProgress(5);
      setStatus('loading');
      setCurrentStep('Initialisation du processus');

      // Appeler le service de vérification
      const result = await ApiService.verifyDocument(request, (currentProgress) => {
        setProgress(currentProgress);
        updateCurrentStep(currentProgress);
      });

      // Mise à jour de l'état après vérification
      setCertificate(result.certificate);
      setCertificateUrl(result.certificateUrl);
      setExtractedData(result.extractedData);

      // Mettre à jour le texte OCR brut
      if (result.rawOcrText) {
        setRawOcrText(result.rawOcrText);
      }

      if (result.success) {
        setStatus('success');
      } else {
        setStatus('invalid');
      }

      setProgress(100);

      // Log les données pour le débogage
      console.log("Données extraites:", result.extractedData);
      console.log("Texte OCR brut:", result.rawOcrText);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setError(error instanceof Error ? error.message : 'Une erreur inconnue est survenue');
      setStatus('error');
    }
  };

  const updateCurrentStep = (progress: number) => {
    if (progress < 30) {
      setCurrentStep('Extraction du texte du document');
    } else if (progress < 50) {
      setCurrentStep('Analyse et extraction des informations');
    } else if (progress < 80) {
      setCurrentStep('Génération des preuves ZKP');
    } else if (progress < 95) {
      setCurrentStep('Création du certificat');
    } else {
      setCurrentStep('Vérification avec AI Judge');
    }
  };

  const handleDownload = () => {
    if (certificateUrl) {
      // Créer un lien de téléchargement avec l'URL de l'objet blob
      const downloadLink = document.createElement('a');
      downloadLink.href = certificateUrl;
      downloadLink.download = `zkp_certificate_${new Date().getTime()}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const toggleRawOcr = () => {
    setShowRawOcr(!showRawOcr);
  };

  // Section des données extraites pour réutilisation
  const renderExtractedData = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium text-slate-900">Données extraites par OCR</h2>
        {rawOcrText && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRawOcr}
            className="flex items-center gap-1"
          >
            {showRawOcr ? <EyeOff size={16} /> : <Eye size={16} />}
            {showRawOcr ? "Masquer texte brut" : "Afficher texte brut"}
          </Button>
        )}
      </div>

      {rawOcrText && showRawOcr && (
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-6 overflow-x-auto">
          <h3 className="text-md font-medium text-slate-900 mb-2">Texte OCR brut</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700">
            {typeof rawOcrText === 'string' ? rawOcrText : JSON.stringify(rawOcrText, null, 2)}
          </pre>
        </div>
      )}

      {extractedData && (
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 overflow-x-auto">
          <h3 className="text-md font-medium text-slate-900 mb-2">Données structurées</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>
          {status === 'loading' ? 'Vérification en cours...' :
           status === 'success' ? 'Vérification réussie' :
           status === 'invalid' ? 'Information non vérifiée' : 'Erreur de vérification'} | ZK Firmation
        </title>
      </Head>

      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {status === 'loading' && (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">
                  Traitement du document en cours...
                </h1>

                <div className="my-8">
                  <Progress value={progress} className="h-3" />
                  <p className="mt-2 text-slate-600">{progress}% - {currentStep}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 max-w-md mx-auto">
                  <p>Nous analysons votre document et générons des preuves ZKP. Cela peut prendre quelques instants.</p>
                </div>
              </div>
            )}

            {/* Section des données extraites - visible à toutes les étapes sauf loading */}
            {status !== 'loading' && extractedData && renderExtractedData()}

            {status === 'success' && certificate && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-green-100 text-green-600 rounded-full p-4 mb-4">
                  <CheckCircle size={48} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Vérification réussie !
                </h1>

                <p className="text-lg text-slate-600 mb-8">
                  Votre document a été vérifié avec succès. Voici votre certificat de preuve.
                </p>

                <div className="bg-white border rounded-xl shadow-sm p-6 mb-8 text-left">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">{certificate?.title || 'Certificat de vérification'}</h2>
                    <p className="text-sm text-slate-500">Généré le {certificate?.date || new Date().toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Document d'origine</h3>
                      <p className="text-slate-900">{certificate?.originalDocument?.name || 'Non disponible'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Requête</h3>
                      <p className="text-slate-900">
                        {typeof certificate?.query === 'object' && certificate?.query?.original
                          ? certificate.query.original
                          : (typeof certificate?.query === 'string'
                              ? certificate.query
                              : 'Non disponible')}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Affirmation vérifiée</h3>
                      <p className="text-slate-900">{certificate?.validatedAffirmation?.statement || 'Non disponible'}</p>
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                        <p className="text-sm flex items-center">
                          <CheckCircle size={16} className="mr-2" />
                          {certificate?.validatedAffirmation?.verification || 'Vérification non disponible'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Identifiant de preuve ZK</h3>
                      <p className="text-slate-900 font-mono text-xs break-all bg-slate-100 p-2 rounded">
                        {certificate?.validatedAffirmation?.zkProofHash || 'Preuve non disponible'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Méthode de vérification</h3>
                      <p className="text-slate-900">{certificate?.verificationMethod || 'Méthode non spécifiée'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Validité</h3>
                      <p className="text-slate-900">
                        Valide jusqu'au {certificate?.validUntil ? new Date(certificate.validUntil).toLocaleDateString('fr-FR') : 'date non spécifiée'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <FileDown size={18} />
                    Télécharger le certificat
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                  >
                    Nouvelle vérification
                  </Button>
                </div>
              </div>
            )}

            {status === 'invalid' && certificate && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full p-4 mb-4">
                  <XCircle size={48} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Information non vérifiée
                </h1>

                <p className="text-lg text-slate-600 mb-8">
                  L'information que vous souhaitez prouver ne correspond pas aux données extraites du document.
                </p>

                <div className="bg-white border rounded-xl shadow-sm p-6 mb-8 text-left">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">{certificate?.title || 'Certificat de vérification'}</h2>
                    <p className="text-sm text-slate-500">Généré le {certificate?.date || new Date().toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Document d'origine</h3>
                      <p className="text-slate-900">{certificate?.originalDocument?.name || 'Non disponible'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Requête</h3>
                      <p className="text-slate-900">
                        {typeof certificate?.query === 'object' && certificate?.query?.original
                          ? certificate.query.original
                          : (typeof certificate?.query === 'string'
                              ? certificate.query
                              : 'Non disponible')}
                      </p>
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                        <p className="text-sm flex items-center">
                          <XCircle size={16} className="mr-2" />
                          {certificate?.validatedAffirmation?.verification || 'Vérification non disponible'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Résultat de la vérification</h3>
                      <p className="text-red-600 font-medium">La vérification a échoué</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <FileDown size={18} />
                    Télécharger le rapport
                  </Button>

                  <Button
                    onClick={() => router.push('/')}
                  >
                    Nouvelle vérification
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full p-4 mb-4">
                  <AlertCircle size={48} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Une erreur est survenue
                </h1>

                <p className="text-lg text-slate-600 mb-8">
                  {error || "Nous n'avons pas pu traiter votre document. Veuillez réessayer."}
                </p>

                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                >
                  Retour à l'accueil
                </Button>
              </div>
            )}
          </div>
        </main>

        <footer className="py-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} ZK Firmation. Tous droits réservés.</p>
        </footer>
      </div>
    </>
  );
}