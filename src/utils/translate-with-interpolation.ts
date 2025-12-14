import type { InitOptions, TFunction } from '@nerimity/i18lite';
import type { TransProps } from '../Trans';
import { decodeHtmlEntities } from './decodeHtmlEntities';
import { hasInterpolation } from './has-interpolation';

const isNode = !globalThis.window;

export const translateWithInterpolation = (t: TFunction, options: InitOptions, props: TransProps) => (item) => {
  const type = typeof item;

  if (type === 'string' && hasInterpolation(item, options.interpolation)) {
    return decodeHtmlEntities(t(item, props.options));
  }

  if (type === 'object') {
    const textContent = item.textContent ?? item.t;
    if (textContent && hasInterpolation(textContent, options.interpolation)) {
      item[isNode ? 't' : 'textContent'] = t(textContent, props.options);
    }
  }

  return item;
};
