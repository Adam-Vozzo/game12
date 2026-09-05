'use client';
import { ISLANDS, SPOTS, RELICS } from './data';
import type { SaveState } from './engine';
export function SeaChart({
  state: s,
  large = false,
  onMark,
}: {
  state: SaveState;
  large?: boolean;
  onMark?: (x: number, z: number) => void;
}) {
  return (
    <svg
      viewBox="-260 -260 520 520"
      className={large ? 'sea-chart large-chart' : 'sea-chart'}
      role="img"
      aria-label="Sea chart. Your boat, discovered islands, fishing grounds, and unexplored waters."
      onClick={(e) => {
        if (!onMark) return;
        const matrix = e.currentTarget.getScreenCTM();
        if (!matrix) return;
        const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
          matrix.inverse(),
        );
        onMark(point.x, point.y);
      }}
    >
      <defs>
        <pattern
          id={large ? 'grid-large' : 'grid-small'}
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="#ecf3d6"
            strokeWidth="1"
            opacity=".13"
          />
        </pattern>
      </defs>
      <rect x="-260" y="-260" width="520" height="520" fill="#2d6b72" />
      <rect
        x="-260"
        y="-260"
        width="520"
        height="520"
        fill={`url(#${large ? 'grid-large' : 'grid-small'})`}
      />
      {Array.from({ length: 100 }, (_, i) => {
        const x = i % 10,
          z = Math.floor(i / 10);
        return (
          !s.charted.includes(`${x},${z}`) && (
            <rect
              key={i}
              x={x * 50 - 250}
              y={z * 50 - 250}
              width="50"
              height="50"
              fill="#153d4b"
              opacity=".76"
            />
          )
        );
      })}
      {ISLANDS.filter((i) => s.discovered.includes(i.id)).map((i) => (
        <g key={i.id}>
          <circle
            cx={i.x}
            cy={i.z}
            r={i.radius + 3}
            fill="#8acaba"
            opacity=".5"
          />
          <circle cx={i.x} cy={i.z} r={i.radius} fill="#decf97" />
          <circle
            cx={i.x - 3}
            cy={i.z - 2}
            r={i.radius * 0.74}
            fill={i.color}
          />
          <circle cx={i.port.x} cy={i.port.z} r="3" fill="#f9ecc2" />
          {large && (
            <text
              x={i.x}
              y={i.z + i.radius + 15}
              fill="#fff7d8"
              textAnchor="middle"
              fontSize="12"
            >
              {i.name}
            </text>
          )}
        </g>
      ))}
      {SPOTS.filter((p) =>
        s.charted.includes(
          `${Math.floor((p.x + 250) / 50)},${Math.floor((p.z + 250) / 50)}`,
        ),
      ).map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.z}
          r={large ? 4 : 3}
          fill="none"
          stroke="#c5eddd"
          strokeWidth="1.5"
        />
      ))}
      {large &&
        RELICS.filter(
          (r) =>
            s.discovered.includes(
              r.id === 'tide' ? 'coral' : r.id === 'song' ? 'kelp' : 'abyss',
            ) && !s.relics.includes(r.id),
        ).map((r) => (
          <g key={r.id}>
            <text
              x={r.x}
              y={r.z}
              textAnchor="middle"
              fill="#efcc7c"
              fontSize="18"
            >
              ✧
            </text>
            <text
              x={r.x}
              y={r.z + 14}
              textAnchor="middle"
              fill="#efcc7c"
              fontSize="10"
            >
              {r.depth} m
            </text>
          </g>
        ))}
      {s.waypoint && (
        <g>
          <line
            x1={s.x}
            y1={s.z}
            x2={s.waypoint.x}
            y2={s.waypoint.z}
            stroke="#efcc7c"
            strokeDasharray="5 5"
            opacity=".6"
          />
          <circle
            cx={s.waypoint.x}
            cy={s.waypoint.z}
            r="8"
            fill="none"
            stroke="#efcc7c"
            strokeWidth="2"
          />
        </g>
      )}
      <g
        transform={`translate(${s.x} ${s.z}) rotate(${(-s.angle * 180) / Math.PI})`}
      >
        <circle r="13" fill="#f6edd5" opacity=".12" />
        <path
          d="M 0 9 L -6 -7 L 0 -3 L 6 -7 Z"
          fill="#ffdc8c"
          stroke="#123d48"
          strokeWidth="1.5"
        />
      </g>
      <text
        x="0"
        y="-234"
        textAnchor="middle"
        fill="#e4e5c4"
        fontSize="17"
        fontFamily="Georgia"
      >
        N
      </text>
    </svg>
  );
}
