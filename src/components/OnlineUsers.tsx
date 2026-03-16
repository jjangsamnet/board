import { useState, useEffect } from 'react';

const FAKE_USERS = [
  { name: '선생님', color: '#F59E0B' },
  { name: '학생1', color: '#3B82F6' },
  { name: '학생2', color: '#10B981' },
  { name: '학생3', color: '#8B5CF6' },
  { name: '학생4', color: '#EF4444' },
  { name: '학생5', color: '#EC4899' },
];

export function useSimulatedUsers() {
  const [activeCount, setActiveCount] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return Math.max(2, Math.min(FAKE_USERS.length, next));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return { activeCount, users: FAKE_USERS.slice(0, activeCount) };
}

interface CursorsOverlayProps {
  enabled: boolean;
}

interface FakeCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export function CursorsOverlay({ enabled }: CursorsOverlayProps) {
  const [cursors, setCursors] = useState<FakeCursor[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const users = FAKE_USERS.slice(1, 3);
    const initial = users.map(u => ({
      id: u.name,
      name: u.name,
      color: u.color,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
    }));
    setCursors(initial);

    const interval = setInterval(() => {
      setCursors(prev =>
        prev.map(c => ({
          ...c,
          x: Math.max(5, Math.min(90, c.x + (Math.random() - 0.5) * 6)),
          y: Math.max(10, Math.min(85, c.y + (Math.random() - 0.5) * 6)),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {cursors.map(cursor => (
        <div
          key={cursor.id}
          className="absolute transition-all duration-[2000ms] ease-in-out"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="drop-shadow-md">
            <path d="M0 0L16 12L6 12L0 20V0Z" fill={cursor.color} />
          </svg>
          <span
            className="absolute left-4 top-3 text-[10px] text-white px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
}
