export default function DataTable({ columns, data, rowKey = 'id', footer }) {
  if (!data?.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, i) => (
              <tr
                key={row[rowKey] ?? row.id_user ?? row.id_role ?? row.id_permission ?? row.id_log ?? i}
                className="transition hover:bg-slate-50/80"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{footer}</div>
      )}
    </div>
  );
}
