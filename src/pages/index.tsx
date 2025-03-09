import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState(0);
  const steps = [
    'Soumettre un document',
    'Extraction de texte',
    'Vérification ZKP',
    'Validation AI',
    'Génération du certificat'
  ];

  return (
    <>
      <Head>
        <title>ZK-Firmation | Vérification Juridique</title>
        <meta name="description" content="Système de vérification juridique automatisé utilisant ZKP" />
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
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Vérification Juridique Automatisée</h2>
            <p className="text-lg">
              ZK-Firmation vous permet de vérifier l'authenticité de vos documents juridiques
              tout en préservant la confidentialité de vos données sensibles.
            </p>
          </section>

          <section className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Processus de Vérification</h3>
            <div className="flex items-center justify-between mb-8">
              {steps.map((text, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center
                                  ${index <= step ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                    {index + 1}
                  </div>
                  <p className="text-sm mt-2 text-center">{text}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                onClick={() => setStep(0)}
              >
                Commencer la vérification
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Confidentialité Garantie</h3>
              <p>Vos données restent privées grâce à la technologie Zero Knowledge Proof.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Vérification IA</h3>
              <p>Notre Instance Intelligente de Vérification analyse la validité de votre contrat.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Certificat Authentifié</h3>
              <p>Recevez un certificat signé numériquement prouvant l'authenticité de votre document.</p>
            </div>
          </section>
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