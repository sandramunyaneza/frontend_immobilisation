import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole } from '../utils/roles';
import AlertBanner from '../components/ui/AlertBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { inputClass } from '../components/ui/FormCard';

export default function Login() {
  const { login, isAuthenticated, loading: authLoading, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('remember_email');
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(getHomePathForRole(role), { replace: true });
  }, [authLoading, isAuthenticated, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, motDePasse);
      if (remember) localStorage.setItem('remember_email', email);
      else localStorage.removeItem('remember_email');
      const userRole = data.role?.nom_role || data.utilisateur?.role?.nom_role;
      navigate(getHomePathForRole(userRole));
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-center bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold leading-tight">
            Gestion des immobilisations
          </h1>
          <p className="mt-4 text-slate-300">
            ImmoManager — inventaire, amortissements, maintenance, utilisateurs et journal d&apos;audit.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ImmoManager</p>
              <p className="text-xs text-slate-500">Espace administrateur</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
          <p className="mt-1 text-sm text-slate-500">Accédez à votre espace de gestion</p>

          <AlertBanner message={error} onClose={() => setError(null)} />

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.fr"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              Se souvenir de mon e-mail
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <LoadingSpinner /> : 'Se connecter'}
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} ImmoManager — Gestion des immobilisations
          </p>
        </div>
      </div>
    </div>
  );
}
