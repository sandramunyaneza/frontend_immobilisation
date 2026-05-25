import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { demandesPiecesService } from '../services/demandesPieces';
import ResourceListPage from '../components/pages/ResourceListPage';

export default function DemandesPiecesPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => demandesPiecesService.list(), []);
  const columns = [
    { key: 'id_piece', label: 'Pièce' },
    { key: 'quantite_demandee', label: 'Quantité' },
    { key: 'statut', label: 'Statut' },
    { key: 'motif', label: 'Motif' },
    { key: 'date_demande', label: 'Date' },
  ];
  return (
    <ResourceListPage title="Demandes de pièces" description="Demandes des techniciens." columns={columns} data={data} loading={loading} error={error} setError={setError} search={search} onSearch={setSearch} />
  );
}
