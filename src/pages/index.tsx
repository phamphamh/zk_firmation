import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FileText, FileQuestion, Lock, TestTube, Shield, Upload, CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (file && query.trim()) {
      // Stocker les informations du fichier (on ne peut pas stocker le fichier réel dans sessionStorage)
      sessionStorage.setItem('verificationFile', JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }));

      // Stocker la requête
      sessionStorage.setItem('verificationQuery', query);

      // Pour les besoins de la démo, détectons si c'est un document de Youssef Boumanzah
      if (file.name.toLowerCase().includes('youssef') || file.name.toLowerCase().includes('boumanzah')) {
        // Stocker les données personnalisées pour Youssef Boumanzah
        const customData = {
          personne: {
            nom: "Boumanzah",
            prenom: "Youssef",
            dateNaissance: "15/05/1998",
            lieuNaissance: "Casablanca",
            nationalite: "Française",
            adresse: "45 rue de la Liberté, 75018 Paris"
          },
          document: {
            type: "Carte Nationale d'Identité",
            numero: "987654321",
            dateEmission: "01/01/2020",
            dateExpiration: "01/01/2030",
            autoritéEmettrice: "République Française"
          }
        };
        sessionStorage.setItem('customData', JSON.stringify(customData));
      }

      // Rediriger vers la page de vérification
      router.push('/verify');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      <Head>
        <title>ZK-Firmation - Vérification anonyme de documents</title>
        <meta name="description" content="Vérifiez vos documents de manière anonyme avec les preuves à divulgation nulle." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="center-container">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center">
          <h1 className="section-title !text-4xl md:!text-5xl mb-6">
            Vérification Anonyme de Documents
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            Vérifiez vos documents sans partager leurs contenus sensibles grâce à la technologie Zero Knowledge Proof
          </p>

          {/* Main Upload Form */}
          <div className="modern-card p-8 mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
              Commencer une vérification
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document à vérifier
                </label>
                <FileUploader
                  onFileSelect={setFile}
                  selectedFile={file}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="query" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Que souhaitez-vous vérifier ?
                </label>
                <textarea
                  id="query"
                  placeholder="Exemple: Est-ce que cette facture a été payée ?"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Posez n'importe quelle question à propos du document. Nous vérifierons cette affirmation sans exposer les données sensibles.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={!file || !query.trim()}
                  className="btn-gradient py-2.5 px-6 w-full md:w-auto"
                >
                  Vérifier maintenant
                </Button>
              </div>
            </form>
          </div>

          {/* Testing Options */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">
              Ou explorez nos options de test
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">
            {/* Lien vers la page de démo existante */}
            <div
              className="modern-card p-6 border border-slate-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-all"
              onClick={() => router.push('/verify?demo=true')}
            >
              <FileQuestion className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Démonstration guidée</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Explorez un exemple pré-configuré pour voir comment fonctionne la vérification.
              </p>
            </div>

            {/* Nouveau lien vers la page de test avec documents mockés */}
            <div
              className="modern-card p-6 border border-slate-100 dark:border-slate-700 hover:border-secondary-300 dark:hover:border-secondary-700 cursor-pointer transition-all"
              onClick={() => router.push('/mock-verify')}
            >
              <TestTube className="w-10 h-10 text-secondary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Test avec documents mockés</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Testez notre système avec 3 types de documents préchargés et analysez leur contenu.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="section-title mb-12">
              Comment ça fonctionne
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Téléchargez un document</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Sélectionnez n'importe quel document que vous souhaitez vérifier sans partager son contenu sensible.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">ZK Proof Technology</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Notre système utilise des preuves à divulgation nulle pour vérifier sans révéler de données sensibles.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Certificat vérifié</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Recevez un certificat cryptographique prouvant la validation de votre document.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer py-8 text-center">
        <div className="center-container">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ZK Firmation. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}