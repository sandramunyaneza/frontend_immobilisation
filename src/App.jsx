import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UtilisateursPage from './pages/Utilisateurs';
import RolesPage from './pages/Roles';
import PermissionsPage from './pages/Permissions';
import ComptableDashboard from './pages/comptable/Dashboard';
import ComptableCategories from './pages/comptable/CategoriesImmobilisations';
import ComptableImmobilisations from './pages/comptable/Immobilisations';
import ComptableAmortissements from './pages/comptable/Amortissements';
import ComptableRapports from './pages/comptable/Rapports';
import MagasinierDashboard from './pages/magasinier/Dashboard';
import MagasinierPieces from './pages/magasinier/Pieces';
import MagasinierStock from './pages/magasinier/Stock';
import MagasinierMouvements from './pages/magasinier/MouvementsStock';
import MagasinierDemandes from './pages/magasinier/DemandesPieces';
import DirecteurDashboard from './pages/directeur-general/Dashboard';
import DirecteurRapports from './pages/directeur-general/Rapports';
import DirecteurDecisions from './pages/directeur-general/Decisions';
import DirecteurAudit from './pages/directeur-general/Audit';
import TechnicienDashboard from './pages/technicien/Dashboard';
import TechnicienPannes from './pages/technicien/Pannes';
import TechnicienMaintenances from './pages/technicien/Maintenances';
import TechnicienReparations from './pages/technicien/Reparations';
import TechnicienDemandesPieces from './pages/technicien/DemandesPieces';
import CategoriesImmobilisationsPage from './pages/CategoriesImmobilisations';
import ImmobilisationsPage from './pages/Immobilisations';
import AmortissementsPage from './pages/Amortissements';
import PannesPage from './pages/Pannes';
import MaintenancesPage from './pages/Maintenances';
import ReparationsPage from './pages/Reparations';
import PiecesPage from './pages/Pieces';
import StockPage from './pages/Stock';
import MouvementsStockPage from './pages/MouvementsStock';
import DemandesPiecesPage from './pages/DemandesPieces';
import DecisionsPage from './pages/Decisions';
import RapportsPage from './pages/Rapports';
import AuditPage from './pages/Audit';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { getHomePathForRole, ROLES } from './utils/roles';

function HomeRedirect() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePathForRole(role)} replace />;
}

function AdminRoute({ children }) {
  return <ProtectedRoute roles={[ROLES.ADMIN]}>{children}</ProtectedRoute>;
}

function ComptableRoute({ children }) {
  return <ProtectedRoute roles={[ROLES.COMPTABLE]}>{children}</ProtectedRoute>;
}

function MagasinierRoute({ children }) {
  return <ProtectedRoute roles={[ROLES.MAGASINIER]}>{children}</ProtectedRoute>;
}

function DirecteurRoute({ children }) {
  return <ProtectedRoute roles={[ROLES.DIRECTEUR]}>{children}</ProtectedRoute>;
}

function TechnicienRoute({ children }) {
  return <ProtectedRoute roles={[ROLES.TECHNICIEN]}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/utilisateurs"
              element={
                <AdminRoute>
                  <UtilisateursPage />
                </AdminRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <AdminRoute>
                  <RolesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <AdminRoute>
                  <PermissionsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <AdminRoute>
                  <AuditPage />
                </AdminRoute>
              }
            />

            <Route
              path="/comptable/dashboard"
              element={
                <ComptableRoute>
                  <ComptableDashboard />
                </ComptableRoute>
              }
            />
            <Route
              path="/comptable/categories-immobilisations"
              element={
                <ComptableRoute>
                  <ComptableCategories />
                </ComptableRoute>
              }
            />
            <Route
              path="/comptable/immobilisations"
              element={
                <ComptableRoute>
                  <ComptableImmobilisations />
                </ComptableRoute>
              }
            />
            <Route
              path="/comptable/amortissements"
              element={
                <ComptableRoute>
                  <ComptableAmortissements />
                </ComptableRoute>
              }
            />
            <Route
              path="/comptable/rapports"
              element={
                <ComptableRoute>
                  <ComptableRapports />
                </ComptableRoute>
              }
            />

            <Route
              path="/magasinier/dashboard"
              element={
                <MagasinierRoute>
                  <MagasinierDashboard />
                </MagasinierRoute>
              }
            />
            <Route
              path="/magasinier/pieces"
              element={
                <MagasinierRoute>
                  <MagasinierPieces />
                </MagasinierRoute>
              }
            />
            <Route
              path="/magasinier/stock"
              element={
                <MagasinierRoute>
                  <MagasinierStock />
                </MagasinierRoute>
              }
            />
            <Route
              path="/magasinier/mouvements-stock"
              element={
                <MagasinierRoute>
                  <MagasinierMouvements />
                </MagasinierRoute>
              }
            />
            <Route
              path="/magasinier/demandes-pieces"
              element={
                <MagasinierRoute>
                  <MagasinierDemandes />
                </MagasinierRoute>
              }
            />

            <Route
              path="/directeur-general/dashboard"
              element={
                <DirecteurRoute>
                  <DirecteurDashboard />
                </DirecteurRoute>
              }
            />
            <Route
              path="/directeur-general/rapports"
              element={
                <DirecteurRoute>
                  <DirecteurRapports />
                </DirecteurRoute>
              }
            />
            <Route
              path="/directeur-general/decisions"
              element={
                <DirecteurRoute>
                  <DirecteurDecisions />
                </DirecteurRoute>
              }
            />
            <Route
              path="/directeur-general/audit"
              element={
                <DirecteurRoute>
                  <DirecteurAudit />
                </DirecteurRoute>
              }
            />

            <Route
              path="/technicien/dashboard"
              element={
                <TechnicienRoute>
                  <TechnicienDashboard />
                </TechnicienRoute>
              }
            />
            <Route
              path="/technicien/pannes"
              element={
                <TechnicienRoute>
                  <TechnicienPannes />
                </TechnicienRoute>
              }
            />
            <Route
              path="/technicien/maintenances"
              element={
                <TechnicienRoute>
                  <TechnicienMaintenances />
                </TechnicienRoute>
              }
            />
            <Route
              path="/technicien/reparations"
              element={
                <TechnicienRoute>
                  <TechnicienReparations />
                </TechnicienRoute>
              }
            />
            <Route
              path="/technicien/demandes-pieces"
              element={
                <TechnicienRoute>
                  <TechnicienDemandesPieces />
                </TechnicienRoute>
              }
            />

            <Route path="/categories-immobilisations" element={<CategoriesImmobilisationsPage />} />
            <Route path="/immobilisations" element={<ImmobilisationsPage />} />
            <Route path="/amortissements" element={<AmortissementsPage />} />
            <Route path="/pannes" element={<PannesPage />} />
            <Route path="/maintenances" element={<MaintenancesPage />} />
            <Route path="/reparations" element={<ReparationsPage />} />
            <Route path="/pieces" element={<PiecesPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/mouvements-stock" element={<MouvementsStockPage />} />
            <Route path="/demandes-pieces" element={<DemandesPiecesPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
