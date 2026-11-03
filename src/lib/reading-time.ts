// CNT-08: reading time computed at build from the raw body, 230 words per minute, never stored.
const WPM = 230;

export function readingTime(body: string | undefined): { words: number; minutes: number } {
  const text = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~\-]+/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / WPM)) };
}
