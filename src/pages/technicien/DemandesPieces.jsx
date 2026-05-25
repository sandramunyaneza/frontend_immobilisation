import { useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { demandesPiecesService } from '../../services/demandesPieces';
import { piecesService } from '../../services/pieces';
import { maintenancesService } from '../../services/maintenances';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDate } from '../../utils/format';
import { formatStatutDemande, statutDemandeVariant } from '../../utils/stockHelpers';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const defaultForm = {
  id_piece: '',
  id_maintenance: '',
  quantite_demandee: '1',
  motif: '',
};

export default function TechnicienDemandesPiecesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => demandesPiecesService.list(),
    []
  );
  const { data: pieces } = useFetch(() => piecesService.list(), []);
  const { data: maintenances } = useFetch(() => maintenancesService.list(), []);

  const pieceMap = useMemo(() => {
    const m = {};
    pieces.forEach((p) => {
      m[p.id_piece] = p;
    });
    return m;
  }, [pieces]);

  const myDemandes = useMemo(() => {
    if (!user?.id_user) return data;
    return data.filter((d) => d.id_technicien === user.id_user);
  }, [data, user?.id_user]);

  const filtered = useMemo(() => {
    let list = myDemandes.length ? myDemandes : data;
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((d) => {
      const p = pieceMap[d.id_piece];
      return (
        p?.nom_piece?.toLowerCase().includes(q) ||
        d.motif?.toLowerCase().includes(q) ||
        d.statut?.toLowerCase().includes(q)
      );
    });
  }, [myDemandes, data, search, pieceMap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await demandesPiecesService.create({
        id_piece: Number(form.id_piece),
        id_maintenance: form.id_maintenance ? Number(form.id_maintenance) : null,
        quantite_demandee: Number(form.quantite_demandee),
        motif: form.motif || null,
      });
      setOpen(false);
      setForm(defaultForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la demande');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'piece',
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
      key: 'maintenance',
      label: 'Maintenance',
      render: (r) => (r.id_maintenance ? `#${r.id_maintenance}` : '—'),
    },
    {
      key: 'motif',
      label: 'Motif',
      render: (r) => (
        <span className="line-clamp-2 max-w-xs text-sm text-slate-600">{r.motif || '—'}</span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutDemandeVariant(r.statut)} dot>
          {formatStatutDemande(r.statut)}
        </Badge>
      ),
    },
    { key: 'date_demande', label: 'Date demande', render: (r) => formatDate(r.date_demande) },
  ];

  return (
    <>
      <Header placeholder="Rechercher une demande..." onSearch={setSearch} />
      <div className="flex-1 p-6">
        <PageHeader
          title="Demandes de pièces"
          description="Création et suivi de vos demandes auprès du magasin."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportPdfButton onExport={exportsService.exportDemandesPiecesPdf} />
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Nouvelle demande
              </button>
            </div>
          }
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description="Créez une demande de pièce pour une maintenance en cours."
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <DataTable columns={columns} data={filtered} rowKey="id_demande" />
          </div>
        )}

        <Modal open={open} title="Nouvelle demande de pièce" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Pièce">
              <select
                required
                className={inputClass}
                value={form.id_piece}
                onChange={(e) => setForm({ ...form, id_piece: e.target.value })}
              >
                <option value="">Sélectionner une pièce...</option>
                {pieces.map((p) => (
                  <option key={p.id_piece} value={p.id_piece}>
                    {p.nom_piece} ({p.reference_piece})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Maintenance liée (optionnel)">
              <select
                className={inputClass}
                value={form.id_maintenance}
                onChange={(e) => setForm({ ...form, id_maintenance: e.target.value })}
              >
                <option value="">Aucune</option>
                {maintenances.map((m) => (
                  <option key={m.id_maintenance} value={m.id_maintenance}>
                    #{m.id_maintenance} — {m.type_maintenance} ({m.statut})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Quantité demandée">
              <input
                type="number"
                min="1"
                required
                className={inputClass}
                value={form.quantite_demandee}
                onChange={(e) => setForm({ ...form, quantite_demandee: e.target.value })}
              />
            </FormField>
            <FormField label="Motif">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Raison de la demande..."
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
              />
            </FormField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </form>
        </Modal>
      </div>
    </>
  );
}
