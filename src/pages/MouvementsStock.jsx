import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { mouvementsStockService } from '../services/mouvementsStock';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function MouvementsStockPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => mouvementsStockService.list(), []);
  const columns = [
    { key: 'id_piece', label: 'Pièce' },
    { key: 'type_mouvement', label: 'Type' },
    { key: 'quantite', label: 'Quantité' },
    { key: 'motif', label: 'Motif' },
    {
      key: 'date_mouvement',
      label: 'Date',
      render: (r) => (r.date_mouvement ? new Date(r.date_mouvement).toLocaleString('fr-FR') : '—'),
    },
  ];
  return (
    <ResourceListPage title="Mouvements de stock" description="Entrées, sorties et ajustements." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
