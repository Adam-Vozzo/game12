'use client';
import { useRef, useState, type ReactNode } from 'react';
export function Joystick({
  onMove,
}: {
  onMove: (x: number, y: number) => void;
}) {
  const pointer = useRef<number | null>(null);
  const [value, setValue] = useState({ x: 0, y: 0 });
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect(),
      x = (e.clientX - r.left - r.width / 2) / 42,
      y = (e.clientY - r.top - r.height / 2) / 42,
      len = Math.max(1, Math.hypot(x, y));
    const v = { x: x / len, y: y / len };
    setValue(v);
    onMove(v.x, v.y);
  }
  function reset() {
    pointer.current = null;
    setValue({ x: 0, y: 0 });
    onMove(0, 0);
  }
  return (
    <div
      className="joystick"
      role="group"
      aria-label="Touch movement control"
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) move(e);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <span className="joystick-label">STEER</span>
      <div
        className="joystick-knob"
        style={{ transform: `translate(${value.x * 34}px,${value.y * 34}px)` }}
      />
      <span className="joystick-north">↑</span>
    </div>
  );
}
export function HoldButton({
  onHold,
  children,
  className = '',
  label,
}: {
  onHold: (held: boolean) => void;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <button
      className={className}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onHold(true);
        }
      }}
      onKeyUp={() => onHold(false)}
      onBlur={() => onHold(false)}
    >
      {children}
    </button>
  );
}
