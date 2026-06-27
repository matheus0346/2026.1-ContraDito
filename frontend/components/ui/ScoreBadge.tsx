import { formatScore, scoreHex } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number | null;
  size?: number;
}

export function ScoreGauge({ score, size = 100 }: ScoreGaugeProps) {
  const stroke = Math.max(4, size * 0.05);
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = score !== null ? circ * (1 - score / 100) : circ;
  const color = scoreHex(score);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute -rotate-90" aria-hidden>
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span
        className="relative font-data font-bold leading-none tabular-nums"
        style={{ fontSize: size * 0.27, color }}
      >
        {formatScore(score)}
      </span>
    </div>
  );
}
