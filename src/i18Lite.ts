export class ResourceStore {
  public data: Resource;
  public options: InitOptions;
  constructor(data: Resource, options: InitOptions) {
    this.data = data;
    this.options = options;
  }

  /**
   * Gets fired when resources got added or removed
   */
  on(event: 'added' | 'removed', callback: (lng: string, ns: string) => void) {}
  /**
   * Remove event listener
   * removes all callback when callback not specified
   */
  off(event: 'added' | 'removed', callback?: (lng: string, ns: string) => void) {}
}

export type $Dictionary<T = unknown> = { [key: string]: T };

export type ResourceKey =
  | string
  | {
      [key: string]: any;
    };

export interface ResourceLanguage {
  [namespace: string]: ResourceKey;
}
export interface Resource {
  [language: string]: ResourceLanguage;
}

export interface InterpolationOptions {
  prefix?: string; // default: '{{'
  suffix?: string; // default: '}}'
}

export interface InitOptions {
  resources: Resource;
  lng?: string;
  interpolation?: InterpolationOptions;

  keySeparator?: false | string; // default: '.'
  nsSeparator?: false | string; // default: ':'
  defaultNS?: string;

  ignoreJSONStructure?: boolean;
}

export interface TOptionsBase {
  lng?: string;
}

export type TOptions<TInterpolationMap extends object = $Dictionary> = TOptionsBase & TInterpolationMap;

export type TFunction = {
  // 1. Overload signature: key and options
  (key: string, options?: {}): string; // I'm assuming it returns a string

  // 2. Overload signature: key, defaultValue, and options
  (key: string, defaultValue: string, options?: {}): string;

  // 3. The single **implementation signature** (must be compatible with all overloads)
  (key: string, arg2?: string | {}, arg3?: {}): string;
};

export interface i18n {
  language: string;
  getResource: (lng: string, ns: string, key: string, options?: any) => any;
  createInstance: () => i18n;
  t: TFunction;
  on: (...args: any[]) => void;
  init: (options?: InitOptions, callback?: (error: any, t: TFunction) => void) => void;
  changeLanguage: (lng: string) => Promise<TFunction>;
  addResourceBundle(lng: string, ns: string, resources: any, deep?: boolean, overwrite?: boolean): i18n;

  store?: ResourceStore;
  options?: InitOptions;
}

const escapeRegex = (str: string) => {
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be ambiguous.
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};
const interpolate = (str: string, data: object): string => {
  // Return the original string if there's nothing to interpolate.
  if (!str) return '';

  // 1. Escape the prefix and suffix to be safely used in the regex.
  const escapedPrefix = escapeRegex(options?.interpolation?.prefix || '{{');
  const escapedSuffix = escapeRegex(options?.interpolation?.suffix || '}}');

  // 2. Build the regex dynamically.
  // Example with defaults: /\{\{\s*(\w+)\s*\}\}/g
  const regex = new RegExp(`${escapedPrefix}\\s*(\\w+)\\s*${escapedSuffix}`, 'g');

  // 3. The replacement logic remains the same.
  return str.replace(regex, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
  });
};

let events: Record<string, (...args: any[]) => void> = {};
let ns = 'translation';
let language = '';
const DefaultOptions: InitOptions = { resources: {}, interpolation: { prefix: '{{', suffix: '}}' } };
let options = DefaultOptions;

const t: TFunction = (key: string, optionsOrDefault?: string | {}, arg3?: {}) => {
  let rawResource =
    getResource(instance.language, ns, key) ?? (typeof optionsOrDefault === 'string' ? optionsOrDefault : key);

  if (arg3 || (typeof optionsOrDefault === 'object' && optionsOrDefault !== null)) {
    return interpolate(rawResource, arg3 || optionsOrDefault);
  }
  return rawResource;
};
const on = (event: string, callback: (...args: any[]) => void) => {
  events[event] = callback;
};
const init: i18n['init'] = (newOptions, callback) => {
  options = DefaultOptions;
  if (newOptions) {
    options = { ...newOptions, interpolation: newOptions?.interpolation || {} };
    options.interpolation.prefix = newOptions.interpolation?.prefix || '{{';
    options.interpolation.suffix = newOptions.interpolation?.suffix || '}}';
  }
  language = newOptions.lng || '';
  instance.store = new ResourceStore(options.resources || {}, options);
  options.resources = {};
  callback(null, t);
};
const changeLanguage = (lang) => {
  language = lang;
  return Promise.resolve(t);
};

const deepMerge = <T extends $Dictionary>(target: T, source: $Dictionary, overwrite: boolean = true): T => {
  // Assert target to 'any' to bypass generic indexing issues
  const targetAsAny = target as any;

  for (const key in source) {
    const targetValue = targetAsAny[key];
    const sourceValue = source[key];

    // 1. Check if both are objects (and not arrays)
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      // 2. If the target value isn't an object (or is an array), initialize it
      if (typeof targetValue !== 'object' || Array.isArray(targetValue)) {
        // FIX: Assert the new empty object as $Dictionary to satisfy index signature requirement
        targetAsAny[key] = {} as $Dictionary;
      }

      // 3. Recursive call. We know sourceValue is an object now, so cast it.
      deepMerge(targetAsAny[key] as $Dictionary, sourceValue as $Dictionary, overwrite);
    } else if (overwrite || targetValue === undefined) {
      // 4. Assign the value (simple property or array)
      targetAsAny[key] = sourceValue;
    }
  }
  return target;
};

const addResourceBundle: i18n['addResourceBundle'] = (lng, ns, resources, deep = true, overwrite = true) => {
  // Ensure the target language and namespace objects exist
  instance.store.data = instance.store.data || {};
  instance.store.data[lng] = instance.store.data[lng] || {};
  instance.store.data[lng][ns] = instance.store.data[lng][ns] || ({} as ResourceKey);

  // We must assert the existing and new resources to a type compatible with spreading (like $Dictionary)
  const existingResources = instance.store.data[lng][ns] as $Dictionary;
  const newResources = resources as $Dictionary;

  if (deep) {
    // Perform a deep merge
    // (Assuming you applied the fixes to deepMerge from the previous step)
    deepMerge(existingResources, newResources, overwrite);
  } else {
    // Shallow merge/overwrite
    instance.store.data[lng][ns] = overwrite
      ? newResources
      : // FIX: Use the asserted variables for the spread operator
        { ...newResources, ...existingResources };
  }

  // Notify listeners that resources have been added
  (events['loaded'] || (() => {}))(lng, ns);

  return instance;
};
const getResource = (
  lng: string,
  ns: string,
  key: string,
  options?: Pick<InitOptions, 'keySeparator' | 'ignoreJSONStructure'>
): any => {
  if (!instance.store || !instance.store.data[lng] || !instance.store.data[lng][ns]) {
    // If the store, language, or namespace doesn't exist, return undefined
    return undefined;
  }

  const namespaceResources = instance.store.data[lng][ns];

  // Check if the resources are a string (which shouldn't happen if properly bundled,
  // but is allowed by your ResourceKey type)
  if (typeof namespaceResources === 'string') {
    // Since there's no way to look up a key in a string, return undefined or the string itself
    return undefined;
  }

  // Determine the key separator, defaulting to what's in options or a fallback (e.g., '.')
  const separator = options?.keySeparator ?? instance.options?.keySeparator ?? '.';

  if (separator === false) {
    // If keySeparator is false, the key is the exact property name
    return namespaceResources[key];
  } else {
    // If a separator is used, we need to traverse the nested object structure
    const keys = key.split(separator);
    let resource = namespaceResources as $Dictionary; // Start traversing from the namespace object

    for (let i = 0; i < keys.length; i++) {
      if (resource[keys[i]] === undefined) {
        return undefined; // Key not found
      }
      // Move to the next nested level
      resource = resource[keys[i]] as $Dictionary;
    }

    return resource;
  }
};

const createInstance = (): i18n => {
  return instance;
};

const instance: i18n = {
  get language() {
    return language;
  },
  createInstance,
  t,
  on,
  init,
  changeLanguage,
  addResourceBundle,
  options,
  getResource,
};

export default instance;
