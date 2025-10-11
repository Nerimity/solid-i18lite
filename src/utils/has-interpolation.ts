import type { InterpolationOptions } from '../i18Lite';

export const hasInterpolation = (value: string, { prefix, suffix }: InterpolationOptions) =>
  value.includes(prefix) && value.includes(suffix);
