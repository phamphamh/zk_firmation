import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FileText, FileQuestion, Lock, TestTube, Shield, Upload, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      <Head>
        <title>ZK-Firmation - Vérification anonyme de documents</title>
        <meta name="description" content="Vérifiez vos documents de manière anonyme avec les preuves à divulgation nulle." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Mesh Gradients */}
      <div className="mesh-gradient mesh-gradient-1"></div>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="aceternity-section relative pt-20 pb-32">
          <div className="aceternity-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-3 py-1 mb-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Technologie de pointe ZKP
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Vérification Anonyme
                </span>
                <br />
                <span className="text-slate-800 dark:text-white">de Documents</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto">
                Vérifiez vos documents sans partager leurs contenus sensibles grâce à la technologie
                <span className="font-semibold"> Zero Knowledge Proof</span>
              </p>

              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 mb-16">
                <button
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="aceternity-button"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 w-4 h-4 inline" />
                </button>

                <button
                  onClick={() => router.push('/verify?demo=true')}
                  className="py-3 px-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Voir la démo
                </button>
              </div>
            </div>

            {/* Main Upload Form */}
            <div id="upload-section" className="aceternity-card max-w-3xl mx-auto p-8 z-10 relative">
              <div className="card-content">
                <h2 className="aceternity-title text-2xl mb-6">
                  Vérifier un document
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

                  <div className="relative">
                    <label htmlFor="query" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Que souhaitez-vous vérifier ?
                    </label>
                    <textarea
                      id="query"
                      placeholder="Exemple: Est-ce que cette facture a été payée ?"
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      rows={3}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 opacity-30 pointer-events-none">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Posez n'importe quelle question à propos du document. Nous vérifierons cette affirmation sans exposer les données sensibles.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={!file || !query.trim()}
                      className="aceternity-button w-full"
                    >
                      Vérifier maintenant
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Testing Options */}
        <section className="aceternity-section bg-white dark:bg-slate-900 py-20">
          <div className="aceternity-container">
            <h2 className="aceternity-title mb-12">
              Options de test
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Lien vers la page de démo existante */}
              <div
                className="aceternity-card p-8 cursor-pointer group"
                onClick={() => router.push('/verify?demo=true')}
              >
                <div className="card-content">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileQuestion className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Démonstration guidée
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Explorez un exemple pré-configuré pour voir comment fonctionne la vérification avec guide interactif.
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-300 font-medium">
                    Démarrer
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Nouveau lien vers la page de test avec documents mockés */}
              <div
                className="aceternity-card p-8 cursor-pointer group"
                onClick={() => router.push('/mock-verify')}
              >
                <div className="card-content">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    Test avec documents mockés
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Testez notre système avec différents types de documents préchargés et analysez leur contenu en détail.
                  </p>
                  <div className="flex items-center text-purple-600 dark:text-purple-300 font-medium">
                    Explorer
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="aceternity-section relative py-24">
          <div className="mesh-gradient mesh-gradient-2"></div>

          <div className="aceternity-container relative z-10">
            <h2 className="aceternity-title mb-16">
              Comment ça fonctionne
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="aceternity-card p-8 group">
                <div className="card-content">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100">
                    1. Téléchargez un document
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Sélectionnez n'importe quel document que vous souhaitez vérifier sans partager son contenu sensible.
                  </p>
                </div>
              </div>

              <div className="aceternity-card p-8 group">
                <div className="card-content">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100">
                    2. Génération de preuves ZK
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Notre système utilise des preuves à divulgation nulle pour vérifier sans révéler aucune donnée sensible.
                  </p>
                </div>
              </div>

              <div className="aceternity-card p-8 group">
                <div className="card-content">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 dark:from-pink-600 dark:to-pink-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100">
                    3. Certificat sécurisé
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Recevez un certificat cryptographique prouvant la validation de votre document de manière sécurisée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="aceternity-footer py-12 text-center">
        <div className="aceternity-container relative z-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-6">
              <Lock className="w-5 h-5 text-indigo-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ZK-Firmation
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
              Vérification anonyme de documents utilisant des technologies cryptographiques avancées pour protéger votre vie privée.
            </p>

            <div className="flex space-x-6 mb-10">
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Contact
              </a>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-500">
              © {new Date().getFullYear()} ZK Firmation. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}