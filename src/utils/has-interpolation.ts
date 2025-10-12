import type { InterpolationOptions } from '@nerimity/i18lite';

export const hasInterpolation = (value: string, { prefix, suffix }: InterpolationOptions) =>
  value.includes(prefix) && value.includes(suffix);
