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
  prefix?: string;
  suffix?: string;
}

export interface InitOptions {
  resources: Resource;
  lng?: string;
  interpolation?: InterpolationOptions;
  keySeparator?: false | string;
  nsSeparator?: false | string;
  defaultNS?: string;
  ignoreJSONStructure?: boolean;
}

export interface TOptionsBase {
  lng?: string;
}

export type TOptions<TInterpolationMap extends object = $Dictionary> = TOptionsBase & TInterpolationMap;

export type TFunction = {
  (key: string, options?: {}): string;
  (key: string, defaultValue: string, options?: {}): string;
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

  store?: { data: Resource };
  options?: InitOptions;
}

let events: Record<string, (...args: any[]) => void> = {};
let ns = 'translation';
let language = '';
const DefaultOptions: InitOptions = { resources: {}, interpolation: { prefix: '{{', suffix: '}}' } };
let options = DefaultOptions;

const escapeRegex = (str: string): string => {
  return str.replace(/[-|\\{}()[\]^$+*?.]/g, (c) => (c === '-' ? '\\x2d' : `\\${c}`));
};

const regexCache = new Map<string, RegExp>();

const interpolate = (str: string, data: object): string => {
  if (!str) return '';

  const interp = options?.interpolation;
  const prefix = interp?.prefix ?? '{{';
  const suffix = interp?.suffix ?? '}}';
  const cacheKey = prefix + '|' + suffix;

  let regex = regexCache.get(cacheKey);
  if (!regex) {
    const escapedPrefix = escapeRegex(prefix);
    const escapedSuffix = escapeRegex(suffix);
    regex = new RegExp(`${escapedPrefix}\\s*(\\w+)\\s*${escapedSuffix}`, 'g');
    regexCache.set(cacheKey, regex);
  }

  return str.replace(regex, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? (data as any)[key] : match;
  });
};

const t: TFunction = (key: string, optionsOrDefault?: string | {}, arg3?: {}) => {
  let rawResource =
    getResource(instance.language, ns, key) ?? (typeof optionsOrDefault === 'string' ? optionsOrDefault : key);

  if (arg3 || (typeof optionsOrDefault === 'object' && optionsOrDefault !== null)) {
    return interpolate(rawResource, (arg3 || optionsOrDefault) as object);
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
  language = newOptions?.lng || '';
  instance.store = { data: options.resources || {} };
  options.resources = {};
  callback?.(null, t);
};

const changeLanguage = (lang: string) => {
  language = lang;
  return Promise.resolve(t);
};

const deepMerge = <T extends $Dictionary>(target: T, source: $Dictionary, overwrite: boolean = true): T => {
  const targetAsAny = target as any;

  for (const key in source) {
    const targetValue = targetAsAny[key];
    const sourceValue = source[key];

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (typeof targetValue !== 'object' || Array.isArray(targetValue)) {
        targetAsAny[key] = {} as $Dictionary;
      }
      deepMerge(targetAsAny[key] as $Dictionary, sourceValue as $Dictionary, overwrite);
    } else if (overwrite || targetValue === undefined) {
      targetAsAny[key] = sourceValue;
    }
  }
  return target;
};

const addResourceBundle: i18n['addResourceBundle'] = (lng, nsName, resources, deep = true, overwrite = true) => {
  instance.store = instance.store || { data: {} };
  instance.store.data = instance.store.data || {};
  instance.store.data[lng] = instance.store.data[lng] || {};
  instance.store.data[lng][nsName] = instance.store.data[lng][nsName] || ({} as ResourceKey);

  const existingResources = instance.store.data[lng][nsName] as $Dictionary;
  const newResources = resources as $Dictionary;

  if (deep) {
    deepMerge(existingResources, newResources, overwrite);
  } else {
    instance.store.data[lng][nsName] = overwrite ? newResources : { ...newResources, ...existingResources };
  }

  (events['loaded'] || (() => {}))(lng, nsName);

  return instance;
};

type Dict = Record<string, any>;

const getResource = (
  lng: string,
  nsName: string,
  key: string,
  opts?: Pick<InitOptions, 'keySeparator' | 'ignoreJSONStructure'>
): any => {
  const store = instance.store;
  if (!store) return undefined;

  const dataForLng = store.data?.[lng];
  if (!dataForLng) return undefined;

  const namespaceResources = dataForLng[nsName];
  if (!namespaceResources) return undefined;

  if (typeof namespaceResources === 'string') return undefined;

  const separator = opts?.keySeparator ?? instance.options?.keySeparator ?? '.';

  if (separator === false) return (namespaceResources as Dict)[key];

  const sepStr = String(separator);
  if (key.indexOf(sepStr) === -1) return (namespaceResources as Dict)[key];

  let obj: any = namespaceResources;
  let start = 0;
  for (let i = 0; i <= key.length; i++) {
    if (i === key.length || key[i] === sepStr) {
      const part = key.slice(start, i);
      if (obj == null) return undefined;
      if (!(part in obj)) return undefined;
      obj = obj[part];
      start = i + 1;
    }
  }

  return obj;
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
