import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { stockService } from '../services/stock';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function StockPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => stockService.list(), []);
  const columns = [
    { key: 'id_piece', label: 'Pièce ID' },
    { key: 'quantite_disponible', label: 'Quantité' },
    { key: 'seuil_alerte', label: 'Seuil alerte' },
    {
      key: 'alerte',
      label: 'État',
      render: (r) =>
        r.quantite_disponible <= r.seuil_alerte ? (
          <span className="text-red-600">Stock faible</span>
        ) : (
          <span className="text-emerald-600">OK</span>
        ),
    },
  ];
  return (
    <ResourceListPage title="Stock des pièces" description="Niveaux de stock disponibles." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
