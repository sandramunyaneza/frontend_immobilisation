import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Évite une page blanche en cas d'erreur React (import manquant, rendu, etc.).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Erreur d&apos;affichage</h1>
            <p className="mt-2 text-sm text-slate-600">
              Une erreur a empêché le chargement de cette page. Rechargez l&apos;application ou
              contactez l&apos;administrateur.
            </p>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-red-700">
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
