export function formatZScore(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}σ`;
}

export function formatDistanceMeters(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`;
}
