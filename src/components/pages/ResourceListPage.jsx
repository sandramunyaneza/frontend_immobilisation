import { useState } from 'react';
import AlertBanner from '../ui/AlertBanner';
import DataTable from '../ui/DataTable';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import PageHeader from '../ui/PageHeader';
import Header from '../layout/Header';

/**
 * Page liste générique connectée à l'API.
 */
export default function ResourceListPage({
  title,
  description,
  columns,
  data,
  loading,
  error,
  setError,
  search,
  onSearch,
  searchPlaceholder,
  action,
  emptyTitle,
}) {
  const filtered = search
    ? data.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <>
      <Header search={search} onSearch={onSearch} placeholder={searchPlaceholder} />
      <div className="flex-1 p-6">
        <PageHeader title={title} description={description} action={action} />
        <AlertBanner message={error} onClose={() => setError(null)} />
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={emptyTitle || 'Aucune donnée disponible'} />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </>
  );
}
