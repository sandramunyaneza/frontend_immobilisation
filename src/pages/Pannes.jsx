import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { pannesService } from '../services/pannes';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function PannesPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => pannesService.list(), []);
  const columns = [
    { key: 'id_immobilisation', label: 'Immobilisation' },
    { key: 'description', label: 'Description' },
    { key: 'gravite', label: 'Gravité' },
    { key: 'statut', label: 'Statut' },
    { key: 'date_panne', label: 'Date' },
  ];
  return (
    <ResourceListPage title="Pannes" description="Pannes déclarées sur les immobilisations." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
