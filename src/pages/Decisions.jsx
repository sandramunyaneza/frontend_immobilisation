import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { decisionsService } from '../services/decisions';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function DecisionsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => decisionsService.list(), []);
  const columns = [
    { key: 'type_decision', label: 'Type' },
    { key: 'statut', label: 'Statut' },
    { key: 'montant_valide', label: 'Montant validé' },
    { key: 'motif', label: 'Motif' },
    { key: 'date_decision', label: 'Date' },
  ];
  return (
    <ResourceListPage title="Décisions" description="Décisions du Directeur Général." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
