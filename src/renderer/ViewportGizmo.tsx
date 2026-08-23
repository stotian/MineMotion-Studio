import { useMemo } from "react";
import type { ViewportOrientation } from "./ViewportOrientation";

interface ViewportGizmoProps {
  orientation: ViewportOrientation | null;
  /** Snap the camera to look down an axis, Blender-style. */
  onPickAxis?: (axis: "x" | "y" | "z", sign: 1 | -1) => void;
  label: string;
}

const RADIUS = 30; // distance of the axis balls from the gizmo centre
const BALL = 8.5;

const AXIS_COLORS = {
  x: { solid: "#cd5c5c", dim: "#7a3a3a" },
  y: { solid: "#8bbf3f", dim: "#4f6d29" },
  z: { solid: "#4f8fd6", dim: "#2f5680" }
} as const;

type AxisKey = "x" | "y" | "z";

interface Handle {
  key: string;
  axis: AxisKey;
  sign: 1 | -1;
  cx: number;
  cy: number;
  depth: number;
}

/**
 * Blender's navigation gizmo: three coloured axis balls orbiting a centre.
 * Positive ends are filled and lettered; negative ends are hollow. Handles are
 * painted back-to-front so the ball nearest the viewer draws on top.
 */
export function ViewportGizmo({ orientation, onPickAxis, label }: ViewportGizmoProps) {
  const handles = useMemo<Handle[]>(() => {
    if (!orientation) return [];
    const built: Handle[] = [];
    for (const axis of ["x", "y", "z"] as const) {
      const [ax, ay, az] = orientation[axis];
      for (const sign of [1, -1] as const) {
        built.push({
          key: `${axis}${sign}`,
          axis,
          sign,
          // Screen space: +x right, +y up (SVG y grows downward, so negate).
          cx: ax * sign * RADIUS,
          cy: -ay * sign * RADIUS,
          depth: az * sign
        });
      }
    }
    return built.sort((a, b) => a.depth - b.depth);
  }, [orientation]);

  if (!orientation) return null;

  return (
    <svg
      className="viewport-gizmo"
      viewBox="-46 -46 92 92"
      role="group"
      aria-label={label}
    >
      {handles.map((handle) => {
        const colors = AXIS_COLORS[handle.axis];
        const positive = handle.sign === 1;
        // Depth cue: axes pointing away from the viewer read dimmer.
        const color = handle.depth >= 0 ? colors.solid : colors.dim;
        return (
          <g key={handle.key}>
            {positive && (
              <line
                x1={0}
                y1={0}
                x2={handle.cx}
                y2={handle.cy}
                stroke={color}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            )}
            <circle
              cx={handle.cx}
              cy={handle.cy}
              r={BALL}
              fill={positive ? color : "#2c2c2c"}
              stroke={color}
              strokeWidth={1.6}
              className={onPickAxis ? "viewport-gizmo-hit" : undefined}
              onPointerDown={
                onPickAxis
                  ? (event) => {
                      event.stopPropagation();
                      onPickAxis(handle.axis, handle.sign);
                    }
                  : undefined
              }
            />
            {positive && (
              <text
                x={handle.cx}
                y={handle.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={700}
                fill="#1b1b1b"
                pointerEvents="none"
              >
                {handle.axis.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
