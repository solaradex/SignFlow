export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d ago`;
  return formatDate(ts);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
}

export function dayLabel(ts: number, now: number = Date.now()): string {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDate(ts);
}
