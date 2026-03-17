export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="kpi">{value}</div>
      {hint ? <div className="muted">{hint}</div> : null}
    </div>
  );
}
