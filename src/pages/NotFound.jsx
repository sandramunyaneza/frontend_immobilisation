import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole } from '../utils/roles';

export default function NotFound() {
  const { role, isAuthenticated } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <FileQuestion className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 text-slate-500">La page demandée n&apos;existe pas ou a été déplacée.</p>
      <Link
        to={isAuthenticated ? getHomePathForRole(role) : '/login'}
        className="mt-8 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        {isAuthenticated ? 'Retour au tableau de bord' : 'Se connecter'}
      </Link>
    </div>
  );
}
