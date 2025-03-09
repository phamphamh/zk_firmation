import React, { useState, useEffect } from 'react';
import { SocratesLogo } from './logo';
import Link from 'next/link';
import { Menu, X, Moon, Sun, Command, Github } from 'lucide-react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Effect pour détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    // Vérifier le mode sombre en fonction des préférences système
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className={`aceternity-header transition-all duration-300 ${scrolled ? 'py-2 shadow-md' : 'py-4'}`}>
      <div className="aceternity-container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <SocratesLogo className="w-8 h-8" />
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            ZK-Firmation
          </span>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/about"
            className="text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            À propos
          </Link>
          <Link
            href="/how-it-works"
            className="text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            Comment ça marche
          </Link>
          <Link
            href="/api-docs"
            className="text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            API
          </Link>
          <Link
            href="/contact"
            className="aceternity-button !py-2"
          >
            Nous contacter
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Command menu"
          >
            <Command className="w-5 h-5" />
          </button>

          <Link
            href="https://github.com/yourusername/zk-firmation"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="w-5 h-5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/about"
              className="py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              À propos
            </Link>
            <Link
              href="/how-it-works"
              className="py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            <Link
              href="/api-docs"
              className="py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              API
            </Link>
            <Link
              href="/contact"
              className="aceternity-button py-2 text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nous contacter
            </Link>

            <div className="flex space-x-4 pt-2">
              <Link
                href="https://github.com/yourusername/zk-firmation"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="GitHub repository"
              >
                <Github className="w-5 h-5" />
              </Link>
              <button
                className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Command menu"
              >
                <Command className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}