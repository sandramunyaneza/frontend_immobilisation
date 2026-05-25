import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { demandesPiecesService } from '../../services/demandesPieces';
import { piecesService } from '../../services/pieces';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/format';
import { formatStatutDemande, statutDemandeVariant } from '../../utils/stockHelpers';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const ACTIONS_MAGASINIER = [
  { statut: 'VALIDEE', label: 'Valider', variant: 'info' },
  { statut: 'FOURNIE', label: 'Marquer fournie', variant: 'success' },
  { statut: 'REFUSEE', label: 'Refuser', variant: 'danger' },
  { statut: 'ANNULEE', label: 'Annuler', variant: 'neutral' },
];

export default function MagasinierDemandesPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => demandesPiecesService.list(),
    []
  );
  const { data: pieces } = useFetch(() => piecesService.list(), []);

  const pieceMap = useMemo(() => {
    const m = {};
    pieces.forEach((p) => {
      m[p.id_piece] = p;
    });
    return m;
  }, [pieces]);

  const filtered = useMemo(() => {
    let list = data;
    if (statutFilter) list = list.filter((d) => d.statut === statutFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => {
        const p = pieceMap[d.id_piece];
        return (
          p?.nom_piece?.toLowerCase().includes(q) ||
          d.motif?.toLowerCase().includes(q) ||
          d.statut?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [data, search, statutFilter, pieceMap]);

  const counts = useMemo(() => {
    const c = { EN_ATTENTE: 0, FOURNIE: 0, REFUSEE: 0 };
    data.forEach((d) => {
      if (c[d.statut] != null) c[d.statut] += 1;
    });
    return c;
  }, [data]);

  const handleStatut = async () => {
    if (!pendingAction) return;
    setSaving(true);
    try {
      await demandesPiecesService.updateStatut(pendingAction.demande.id_demande, pendingAction.statut);
      setPendingAction(null);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du traitement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'id_piece',
      label: 'Pièce demandée',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">
            {pieceMap[r.id_piece]?.nom_piece || `ID ${r.id_piece}`}
          </p>
          <p className="text-xs text-slate-500">
            Réf. {pieceMap[r.id_piece]?.reference_piece || '—'}
          </p>
        </div>
      ),
    },
    { key: 'quantite_demandee', label: 'Quantité' },
    {
      key: 'id_technicien',
      label: 'Technicien',
      render: (r) => `Demandeur #${r.id_technicien}`,
    },
    {
      key: 'id_maintenance',
      label: 'Maintenance',
      render: (r) => (r.id_maintenance ? `#${r.id_maintenance}` : '—'),
    },
    { key: 'motif', label: 'Motif' },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutDemandeVariant(r.statut)} dot>
          {formatStatutDemande(r.statut)}
        </Badge>
      ),
    },
    {
      key: 'date_demande',
      label: 'Date',
      render: (r) => formatDate(r.date_demande),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.statut === 'EN_ATTENTE' || r.statut === 'VALIDEE' ? (
          <div className="flex flex-wrap gap-1">
            {ACTIONS_MAGASINIER.filter((a) => {
              if (r.statut === 'VALIDEE' && a.statut === 'VALIDEE') return false;
              return true;
            }).map((a) => (
              <button
                key={a.statut}
                type="button"
                onClick={() => setPendingAction({ demande: r, statut: a.statut, label: a.label })}
                className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une demande..."
        action={<ExportPdfButton onExport={exportsService.exportDemandesPiecesPdf} />}
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Demandes de pièces"
          description="Demandes des techniciens — validation et approvisionnement."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="En attente" value={counts.EN_ATTENTE} icon={Package} accent="amber" />
            <StatCard label="Fournies" value={counts.FOURNIE} accent="emerald" />
            <StatCard label="Refusées" value={counts.REFUSEE} accent="red" />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {['', 'EN_ATTENTE', 'VALIDEE', 'FOURNIE', 'REFUSEE', 'ANNULEE'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatutFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statutFilter === s ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {s ? formatStatutDemande(s) : 'Toutes'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucune demande à afficher" />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_demande"
            footer={`Affichage de ${filtered.length} sur ${data.length} demande${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        title="Traiter la demande"
        message={
          pendingAction
            ? `Confirmer l'action « ${pendingAction.label} » pour la demande #${pendingAction.demande.id_demande} ?`
            : ''
        }
        confirmLabel={pendingAction?.label || 'Confirmer'}
        variant={pendingAction?.statut === 'REFUSEE' ? 'danger' : 'success'}
        onConfirm={handleStatut}
        onClose={() => setPendingAction(null)}
        loading={saving}
      />
    </>
  );
}
