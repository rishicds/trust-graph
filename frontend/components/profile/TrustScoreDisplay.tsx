import { TrustScore } from "@/lib/api";
import { profile as profileCopy, scoreDimensionMeta } from "@/constants";
import { colors } from "@/constants/theme";
import { effects, pills, surfaces, typography } from "@/constants/styles";

function DimensionBar({
  label,
  value,
  summary,
}: {
  label: string;
  value: number;
  summary?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-medium">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F1F1F1]">
        <div
          className="h-full rounded-full bg-teal transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {summary && <p className="mt-1.5 text-xs leading-snug text-muted">{summary}</p>}
    </div>
  );
}

const dimensionConfig = scoreDimensionMeta.map((dim) => ({
  label: dim.label,
  key: dim.key,
  summary: dim.summary,
}));

export function TrustScoreDisplay({
  score,
  compact = false,
  showDimensions = true,
}: {
  score: TrustScore;
  compact?: boolean;
  showDimensions?: boolean;
}) {
  return (
    <div className={`${effects.scoreAnimate} ${compact ? "" : "space-y-6"}`}>
      <div className={compact ? "flex items-end gap-3" : ""}>
        <p className={`font-bold tracking-tight ${compact ? typography.scoreCompact : typography.scoreHero}`}>
          {score.overall.toFixed(0)}
        </p>
        {!compact && <span className="mb-3 text-2xl text-muted">{profileCopy.score.max}</span>}
        {score.delta !== 0 && (
          <span className={`text-sm font-medium ${score.delta > 0 ? "text-teal" : "text-muted"}`}>
            {score.delta > 0 ? "+" : ""}
            {score.delta.toFixed(1)} {profileCopy.score.deltaSuffix}
          </span>
        )}
      </div>

      {showDimensions && (
        <div className="grid gap-4">
          {dimensionConfig.map(({ label, key, summary }) => (
            <DimensionBar
              key={key}
              label={label}
              summary={summary}
              value={
                score.dimensions[key] ??
                (key === "impact_signals" ? score.dimensions.trust_ratio : 0) ??
                0
              }
            />
          ))}
        </div>
      )}

      {!compact && (score.positive_signals?.length || score.negative_signals?.length) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {score.positive_signals && score.positive_signals.length > 0 && (
            <div className={surfaces.positivePanel}>
              <p className={`text-sm font-semibold text-[${colors.accentText}]`} style={{ color: colors.accentText }}>
                {profileCopy.score.positiveTitle}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: colors.accentTextMuted }}>
                {score.positive_signals.map((s) => (
                  <li key={s}>+ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {score.negative_signals && score.negative_signals.length > 0 && (
            <div className={surfaces.negativePanel}>
              <p className="text-sm font-semibold">{profileCopy.score.negativeTitle}</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                {score.negative_signals.map((s) => (
                  <li key={s}>− {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileCard({
  handle,
  displayName,
  headline,
  score,
  capabilities,
  evidenceCount,
  isShadow,
}: {
  handle: string;
  displayName: string;
  headline?: string;
  score: number;
  capabilities: string[];
  evidenceCount: number;
  isShadow?: boolean;
}) {
  return (
    <a href={`/${handle}`} className={surfaces.cardHover}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{displayName}</p>
          {headline && <p className="mt-1 text-sm text-muted">{headline}</p>}
        </div>
        <p className={typography.monoStat}>{score.toFixed(0)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {capabilities.slice(0, 3).map((cap) => (
          <span key={cap} className={pills.capability}>
            {cap}
          </span>
        ))}
      </div>
      <p className={`mt-4 ${typography.caption}`}>
        {evidenceCount} {profileCopy.card.evidenceSuffix}
        {isShadow ? ` · ${profileCopy.card.shadowSuffix}` : ""}
      </p>
    </a>
  );
}
