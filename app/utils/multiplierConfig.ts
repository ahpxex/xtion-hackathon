export const multiplierTiers = [1, 2, 5, 20, 50, 100] as const;

export const MAX_MULTIPLIER_LEVEL = multiplierTiers.length - 1;

export function getMultiplierValue(level: number): number {
  const clampedLevel = Math.max(0, Math.min(level, MAX_MULTIPLIER_LEVEL));
  return multiplierTiers[clampedLevel];
}

export function getNextMultiplierPrice(level: number): number | undefined {
  if (level >= MAX_MULTIPLIER_LEVEL) {
    return undefined;
  }
  return 50 * (level + 1);
}

export function formatMultiplierEffect(level: number): string {
  return `点击 x${getMultiplierValue(level)}`;
}
