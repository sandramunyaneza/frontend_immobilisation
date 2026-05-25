import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { amortissementsService } from '../services/amortissements';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function AmortissementsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => amortissementsService.list(), []);
  const columns = [
    { key: 'id_immobilisation', label: 'Immobilisation' },
    { key: 'methode', label: 'Méthode' },
    { key: 'montant_annuel', label: 'Montant annuel' },
    { key: 'exercice', label: 'Exercice' },
    { key: 'valeur_nette', label: 'Valeur nette' },
  ];
  return (
    <ResourceListPage title="Amortissements" description="Calculs d'amortissement comptable." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
