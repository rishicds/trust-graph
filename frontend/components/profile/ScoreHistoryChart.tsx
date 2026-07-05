import { ScoreHistoryPoint } from "@/lib/api";

export function ScoreHistoryChart({ history }: { history: ScoreHistoryPoint[] }) {
  if (!history.length) {
    return <p className="text-sm text-muted">Score history appears after Pro upgrade and profile syncs.</p>;
  }

  const sorted = [...history].reverse();
  const max = Math.max(...sorted.map((h) => h.overall), 100);
  const min = Math.min(...sorted.map((h) => h.overall), 0);
  const range = Math.max(max - min, 1);

  return (
    <div className="flex h-32 items-end gap-1">
      {sorted.map((point, i) => {
        const height = ((point.overall - min) / range) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-teal/80"
              style={{ height: `${Math.max(height, 8)}%` }}
              title={`${point.overall.toFixed(0)} — ${new Date(point.recorded_at).toLocaleDateString()}`}
            />
          </div>
        );
      })}
    </div>
  );
}
