import React, { useState } from 'react';
import { SocratesLogo } from './logo';
import Link from 'next/link';
import { Menu, X, Moon, Sun } from 'lucide-react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
    <header className="site-header">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SocratesLogo className="text-primary-600 dark:text-primary-400" />
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 text-transparent bg-clip-text">
            ZK_Firmation
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <p className="text-slate-500 dark:text-slate-400 italic font-light">
            "All I know is that I know nothing"
          </p>

          <nav className="flex space-x-6">
            <Link
              href="/"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/mock-verify"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
            >
              Test
            </Link>
            <Link
              href="/about"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
            >
              À propos
            </Link>
          </nav>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-600 dark:text-slate-300"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors py-2 px-4 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/mock-verify"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors py-2 px-4 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Test
            </Link>
            <Link
              href="/about"
              className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors py-2 px-4 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              À propos
            </Link>
          </nav>

          <p className="text-slate-500 dark:text-slate-400 italic text-sm mt-4 px-4">
            "All I know is that I know nothing"
          </p>
        </div>
      )}
    </header>
  );
}