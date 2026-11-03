// CNT-06 conventions: one formatter, "17 Dec 2022" style; ISO for machine-readable attributes.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatMonthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function year(d: Date): number {
  return d.getUTCFullYear();
}
