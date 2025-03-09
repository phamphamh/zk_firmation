import React, { useState } from 'react';
import {
  MOCK_DOCUMENTS,
  MockDocument,
  verifyMockDocument
} from '../services/mock-document-service';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MockVerifyPage() {
  const router = useRouter();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [currentDoc, setCurrentDoc] = useState<MockDocument | null>(null);

  // Exemples de questions prédéfinies
  const exampleQueries = [
    "Est-ce que cette facture a été payée ?",
    "Quel est le montant du loyer ?",
    "Est-ce que la carte d'identité est toujours valide ?",
    "Le contrat est-il signé par toutes les parties ?",
    "Quelle est l'identité du titulaire de la carte ?",
    "Quelle est la date d'expiration du document ?"
  ];

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocId(docId);
    const doc = MOCK_DOCUMENTS.find(d => d.id === docId);
    setCurrentDoc(doc || null);
    setResult(null);
  };

  const handleVerify = async () => {
    if (!selectedDocId || !query) return;

    setLoading(true);
    try {
      const verificationResult = await verifyMockDocument(selectedDocId, query);
      setResult(verificationResult);
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setResult({
        isValid: false,
        reason: `Erreur: ${error.message}`,
        documentInfo: null,
        extractedInfo: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>ZK-Firmation - Test de Vérification</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Test de Vérification avec Documents Mockés</h1>

        {/* Sélection du document */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Sélectionnez un document à vérifier</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_DOCUMENTS.map(doc => (
              <div
                key={doc.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDocId === doc.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <h3 className="font-medium text-lg">{doc.title}</h3>
                <p className="text-sm text-gray-500">{doc.filename}</p>
                <p className="text-xs mt-2 bg-gray-100 inline-block px-2 py-1 rounded">
                  {doc.type}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Document sélectionné */}
        {currentDoc && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Document sélectionné: {currentDoc.title}</h2>

            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-64">
              <pre>{currentDoc.content}</pre>
            </div>

            <div className="mt-4">
              <h3 className="font-medium">Métadonnées:</h3>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(currentDoc.metadata).map(([key, value]) => (
                  <li key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Formulaire de requête */}
        {selectedDocId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Formulez votre question</h2>

            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                Que souhaitez-vous vérifier sur ce document ?
              </label>
              <textarea
                id="query"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Est-ce que cette facture a été payée ?"
              />
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Exemples de questions:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    onClick={() => handleExampleQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleVerify}
              disabled={loading || !query}
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>
        )}

        {/* Résultat */}
        {result && (
          <div className={`bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 ${
            result.isValid ? 'border-green-500' : 'border-red-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Résultat de la vérification</h2>

            <div className={`text-lg font-medium mb-2 ${
              result.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.isValid ? '✅ Affirmation validée' : '❌ Affirmation non validée'}
            </div>

            <p className="text-gray-700 mb-4">{result.reason}</p>

            {result.extractedInfo && Object.keys(result.extractedInfo).length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Informations extraites:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-1">
                    {Object.entries(result.extractedInfo).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton retour */}
        <div className="text-center mt-8">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}