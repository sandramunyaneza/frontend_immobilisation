import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { reparationsService } from '../services/reparations';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function ReparationsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => reparationsService.list(), []);
  const columns = [
    { key: 'id_maintenance', label: 'Maintenance' },
    { key: 'description', label: 'Description' },
    { key: 'cout', label: 'Coût' },
    { key: 'date_realisation', label: 'Date' },
  ];
  return (
    <ResourceListPage title="Réparations" description="Réparations enregistrées." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
