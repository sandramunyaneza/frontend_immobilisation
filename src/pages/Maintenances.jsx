import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { maintenancesService } from '../services/maintenances';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function MaintenancesPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => maintenancesService.list(), []);
  const columns = [
    { key: 'id_immobilisation', label: 'Immobilisation' },
    { key: 'type_maintenance', label: 'Type' },
    { key: 'statut', label: 'Statut' },
    { key: 'date_planifiee', label: 'Date planifiée' },
    { key: 'cout_prevu', label: 'Coût prévu' },
  ];
  return (
    <ResourceListPage title="Maintenances" description="Interventions préventives et correctives." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
