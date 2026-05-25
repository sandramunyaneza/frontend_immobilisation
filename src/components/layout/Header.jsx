import { Bell, HelpCircle } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

export default function Header({ search, onSearch, placeholder, action }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-4">
        {onSearch ? (
          <SearchBar value={search} onChange={onSearch} placeholder={placeholder} className="max-w-xl" />
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Aide"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          {action}
        </div>
      </div>
    </header>
  );
}
