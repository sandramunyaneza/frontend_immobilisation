export default function AlertBanner({ type = 'error', message, onClose }) {
  if (!message) return null;
  const styles =
    type === 'error'
      ? 'bg-red-50 text-red-800 border-red-200'
      : type === 'success'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-blue-50 text-blue-800 border-blue-200';
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <div className="flex items-center justify-between gap-2">
        <span>{message}</span>
        {onClose && (
          <button type="button" onClick={onClose} className="font-medium hover:underline">
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}
