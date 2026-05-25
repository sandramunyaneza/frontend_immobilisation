import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { piecesService } from '../services/pieces';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function PiecesPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => piecesService.list(), []);
  const columns = [
    { key: 'nom_piece', label: 'Pièce' },
    { key: 'reference_piece', label: 'Référence' },
    { key: 'prix_marche', label: 'Prix marché' },
  ];
  return (
    <ResourceListPage title="Pièces de rechange" description="Catalogue des pièces détachées." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
