// CNT-02: the one place pillar ids map to display names.
export const PILLAR_NAMES = {
  production: 'Running production',
  architecture: 'Architecture on AWS and .NET',
  judgement: 'Engineering judgement',
  'ai-engineering': 'AI-assisted engineering',
} as const;

export type Pillar = keyof typeof PILLAR_NAMES;

export function pillarName(id: Pillar): string {
  return PILLAR_NAMES[id];
}
