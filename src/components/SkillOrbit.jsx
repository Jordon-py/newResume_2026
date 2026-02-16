import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animated as Animated, to, useSprings } from "@react-spring/web";

/**
 * SkillOrbit
 * - Uses useSprings to position multiple "chips" around a circle.
 * - Expands radius on hover/focus and supports a subtle parallax drift.
 *
 * Customization:
 * - skills: [{ id, label }]
 * - radius / expandedRadius
 * - parallax: 0..1
 * - springConfig: react-spring config object
 */
export default function SkillOrbit({
  skills,
  radius = 115,
  expandedRadius = 160,
  parallax = 0.35,
  springConfig = { tension: 240, friction: 20 },
  onSelect,
}) {
  const stageRef = useRef(null);
  const rafRef = useRef(0);

  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const items = useMemo(() => {
    // Ensure stable ids/labels
    return (skills || []).map((s, idx) => ({
      id: s.id ?? String(idx),
      label: s.label ?? String(s),
    }));
  }, [skills]);

  const basePositions = useCallback(
    (r) =>
      items.map((_, i) => {
        const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
      }),
    [items]
  );

  const [springs, api] = useSprings(
    items.length,
    (i) => {
      const pos = basePositions(radius)[i] || { x: 0, y: 0 };
      return {
        from: { x: 0, y: 0, scale: 0.85, opacity: 0 },
        to: { x: pos.x, y: pos.y, scale: 1, opacity: 1 },
        delay: 60 + i * 30,
        config: springConfig,
      };
    },
    // re-init on item count change only
    [items.length]
  );

  // Expand/contract layout when expanded toggles
  useEffect(() => {
    const r = expanded ? expandedRadius : radius;
    const pos = basePositions(r);
    api.start((i) => ({
      x: pos[i]?.x ?? 0,
      y: pos[i]?.y ?? 0,
      scale: items[i]?.id === activeId ? 1.12 : 1,
      config: springConfig,
    }));
  }, [expanded, expandedRadius, radius, api, items, activeId, springConfig, basePositions]);

  // Parallax drift without forcing React re-renders
  const onPointerMove = (e) => {
    if (!stageRef.current || parallax <= 0) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = stageRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      const clamp = (v) => Math.max(-1, Math.min(1, v));
      const px = clamp(dx) * 14 * parallax;
      const py = clamp(dy) * 14 * parallax;

      const r = expanded ? expandedRadius : radius;
      const pos = basePositions(r);

      api.start((i) => ({
        x: (pos[i]?.x ?? 0) + px,
        y: (pos[i]?.y ?? 0) + py,
        immediate: false,
        config: springConfig,
      }));
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(rafRef.current);
    const r = expanded ? expandedRadius : radius;
    const pos = basePositions(r);
    api.start((i) => ({
      x: pos[i]?.x ?? 0,
      y: pos[i]?.y ?? 0,
      config: springConfig,
    }));
  };

  const select = (id) => {
    setActiveId(id);
    onSelect?.(id);
  };

  return (
    <div className="orbitWrap card">
      <div
        ref={stageRef}
        className="orbitStage"
        onPointerMove={onPointerMove}
        onPointerLeave={onLeave}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={() => setExpanded(false)}
        aria-label="Skill orbit"
      >
        <div className="orbitCenter">
          <div style={{ fontWeight: 650, color: "var(--text)" }}>Skills</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Hover or tab through chips
          </div>
        </div>

        {springs.map((s, i) => {
          const item = items[i];
          const active = item?.id === activeId;

          return (
            <Animated.button
              key={item.id}
              type="button"
              className="orbitChip"
              data-active={active ? "true" : "false"}
              onClick={() => select(item.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") select(item.id);
              }}
              style={{
                opacity: s.opacity,
                transform: to([s.x, s.y, s.scale], (x, y, sc) => {
                  // include center offset so each chip is centered on its point
                  return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${sc})`;
                }),
              }}
              aria-pressed={active}
            >
              {item.label}
            </Animated.button>
          );
        })}
      </div>
    </div>
  );
}
