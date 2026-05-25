import { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Bouton de téléchargement PDF — appelle une fonction du service exports.
 */
export default function ExportPdfButton({
  onExport,
  label = 'Télécharger PDF',
  className = '',
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onExport();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let message = 'Erreur lors du téléchargement du PDF.';
      if (typeof detail === 'string') message = detail;
      else if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) message = json.detail;
        } catch {
          /* ignore */
        }
      }
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={
        className ||
        'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60'
      }
    >
      <Download className="h-4 w-4" />
      {loading ? 'Génération…' : label}
    </button>
  );
}
