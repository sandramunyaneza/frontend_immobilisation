import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { rapportsService } from '../services/rapports';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function RapportsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => rapportsService.list(), []);
  const columns = [
    { key: 'titre', label: 'Titre' },
    { key: 'type_rapport', label: 'Type' },
    {
      key: 'date_generation',
      label: 'Date',
      render: (r) => (r.date_generation ? new Date(r.date_generation).toLocaleString('fr-FR') : '—'),
    },
  ];
  return (
    <ResourceListPage title="Rapports" description="Rapports financiers, techniques et d'audit." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
