import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileCheck, Award } from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>À propos | ZK Firmation</title>
      </Head>

      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                <ArrowLeft size={16} className="mr-1" />
                Retour à l'accueil
              </Link>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-6">
              À propos de ZK Firmation
            </h1>

            <div className="prose prose-blue max-w-none">
              <p className="lead text-xl text-slate-700">
                ZK Firmation utilise des preuves à divulgation nulle de connaissance (Zero-Knowledge Proofs ou ZKP)
                pour vérifier l'authenticité des documents tout en préservant la confidentialité des informations sensibles.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Qu'est-ce qu'une preuve à divulgation nulle de connaissance ?</h2>

              <p>
                Une preuve à divulgation nulle de connaissance est un protocole cryptographique qui permet à une partie
                (le prouveur) de prouver à une autre partie (le vérificateur) qu'une affirmation est vraie, sans révéler
                aucune information supplémentaire que le fait que l'affirmation est vraie.
              </p>

              <p>
                Par exemple, plutôt que de révéler votre adresse complète dans un document, vous pouvez prouver que vous
                résidez dans une certaine ville sans divulguer votre adresse exacte. C'est comme prouver que vous connaissez
                un mot de passe sans jamais avoir à révéler le mot de passe lui-même.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
                <p className="font-medium">
                  Les ZKP ont trois propriétés fondamentales :
                </p>
                <ul>
                  <li><strong>Complétude</strong> : Si l'affirmation est vraie, un prouveur honnête peut convaincre un vérificateur.</li>
                  <li><strong>Solidité</strong> : Si l'affirmation est fausse, aucun prouveur malhonnête ne peut convaincre un vérificateur honnête.</li>
                  <li><strong>Divulgation nulle</strong> : Le vérificateur n'apprend rien d'autre que la véracité de l'affirmation.</li>
                </ul>
              </div>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Comment ZK Firmation utilise les ZKP</h2>

              <p>
                Notre application utilise la technologie ZKP pour permettre aux utilisateurs de :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center mb-3 text-green-600">
                    <ShieldCheck size={24} />
                    <h3 className="ml-2 text-lg font-medium">Vérifier l'authenticité</h3>
                  </div>
                  <p className="text-slate-700">
                    Prouver qu'un document est authentique sans révéler son contenu complet,
                    en vérifiant cryptographiquement certains attributs.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center mb-3 text-blue-600">
                    <Lock size={24} />
                    <h3 className="ml-2 text-lg font-medium">Protéger la confidentialité</h3>
                  </div>
                  <p className="text-slate-700">
                    Partager des informations vérifiées sans exposer les données personnelles
                    ou sensibles contenues dans le document.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center mb-3 text-purple-600">
                    <FileCheck size={24} />
                    <h3 className="ml-2 text-lg font-medium">Attester des faits</h3>
                  </div>
                  <p className="text-slate-700">
                    Prouver des affirmations spécifiques (comme l'âge, le domicile, etc.)
                    sans révéler l'intégralité du document d'identité.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center mb-3 text-amber-600">
                    <Award size={24} />
                    <h3 className="ml-2 text-lg font-medium">Générer des certificats</h3>
                  </div>
                  <p className="text-slate-700">
                    Créer des certificats de vérification qui peuvent être partagés
                    et vérifiés par des tiers sans compromettre la confidentialité.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Applications pratiques</h2>

              <p>
                Les ZKP et notre plateforme ZK Firmation peuvent être utilisés dans de nombreux contextes :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Vérification d'identité pour l'accès à des services en ligne sans partager l'intégralité de vos documents d'identité</li>
                <li>Certificats de résidence pour des démarches administratives</li>
                <li>Preuves d'éligibilité pour des aides ou services spécifiques</li>
                <li>Vérification de diplômes ou de certifications professionnelles</li>
                <li>Attestations d'hébergement ou de logement</li>
                <li>Vérification de documents contractuels sans en révéler tous les détails</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Technologie</h2>

              <p>
                ZK Firmation est construit sur des technologies modernes et sécurisées :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Framework ZKP o1js de Mina Protocol pour la génération et la vérification de preuves</li>
                <li>OCR et extraction de texte alimentée par des modèles d'IA avancés</li>
                <li>Interface utilisateur intuitive développée avec Next.js et TailwindCSS</li>
                <li>Algorithmes de cryptographie de pointe pour sécuriser les données</li>
              </ul>

              <div className="my-10 text-center">
                <Link href="/">
                  <Button className="mx-auto">
                    Essayer ZK Firmation maintenant
                  </Button>
                </Link>
              </div>

              <div className="bg-slate-100 p-6 rounded-lg my-6">
                <h3 className="text-xl font-semibold mb-3">Note importante</h3>
                <p>
                  Cette application est une démonstration de concept. Elle vise à illustrer comment les preuves à
                  divulgation nulle de connaissance peuvent être appliquées dans des scénarios réels de vérification
                  de documents. Dans un environnement de production, des mesures de sécurité supplémentaires seraient
                  nécessaires.
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} ZK Firmation. Tous droits réservés.</p>
        </footer>
      </div>
    </>
  );
}