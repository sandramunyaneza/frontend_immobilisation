import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole } from '../utils/roles';

export default function Unauthorized() {
  const { role } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ShieldOff className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Accès non autorisé</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Votre rôle ne permet pas d&apos;accéder à cette page. Contactez un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
      </p>
      <Link
        to={getHomePathForRole(role)}
        className="mt-8 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
