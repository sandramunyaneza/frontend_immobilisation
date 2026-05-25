export default function LoadingSpinner({ size = 'md' }) {
  const s = size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div
      className={`${s} animate-spin rounded-full border-2 border-blue-100 border-t-blue-600`}
      role="status"
      aria-label="Chargement"
    />
  );
}
