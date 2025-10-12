# i18next for Solid

![npm (scoped)](https://img.shields.io/npm/v/@nerimity/solid-i18lite?color=seagreen)
[![codecov](https://codecov.io/gh/nerimity/solid-i18lite/branch/main/graph/badge.svg?token=RGWEZWK8T2)](https://codecov.io/gh/nerimity/solid-i18lite)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@nerimity/solid-i18lite)](https://bundlephobia.com/package/@nerimity/solid-i18lite)

The purpose of this library is to provide ability to support [i18next](https://www.i18next.com/) library in Solid applications
with `<TransProvider />` and `<Trans />` components.

## Table of Contents

1. [Usage](#usage)
   1. [Simple Example](#simple-example)
   1. [Add Resources](#add-resources)
   1. [Change a Language](#change-a-language)
   1. [T Function](#t-function)
1. [Interpolation](#interpolation)
   1. [Nested JSX](#nested-jsx)
1. [API](#api)
   1. [Components](#components)
   1. [Utilities](#utilities)

## Usage

Installation:

```sh
npm install @nerimity/solid-i18lite @nerimity/i18lite --save
```

### Simple Example

`<TransProvider />` must wrap Solid application's most parent component (e.g. `<App />`). `<Trans />` component's `key` property is mandatory.

Default value can be wrapped with `<Trans />` component or set with `options` or `children` property.

```tsx
// esm
import { TransProvider, Trans } from '@nerimity/solid-i18lite';

// cjs
const { TransProvider, Trans } = require('@nerimity/solid-i18lite');

render(() => (
  <TransProvider>
    <App>
      <Trans key="greeting" />
      {/* or */}
      <Trans key="greeting">Hello!</Trans>
      {/* or */}
      <Trans key="greeting" options={{ defaultValue: 'Hello!' }} />
      {/* or */}
      <Trans key="greeting" options="Hello!" />
      {/* or */}
      <Trans key="greeting" children="Hello!" />
    </App>
  </TransProvider>
));
```

### Add Resources

Resources can be added on initialization with `options` property in `<TransProvider />` or
by calling `addResources` method from `TransContext`, which can be got with `useTransContext()`.

```tsx
import { Trans, TransProvider, useTransContext } from '@nerimity/solid-18lite';

const resources = {
    lt: {...},
    pl: {...},
};

render(() => <TransProvider options={{ resources }} children={<App />} />, container);

{/* or */}

const Component = () => {
    const [, actions] = useTransContext();
    actions.addResources('lt', 'translation', resources.lt);
    actions.addResources('pl', 'translation', resources.pl);

    return <Trans key="greeting">Hello!</Trans>;
};
```

### Change a Language

Default language can be provided to `<TransProvider />` with `lng` or `options` property.

`options.lng` overrides `lng` property.

```tsx
<TransProvider lng="lt" children={...} />
<TransProvider options={{lng: 'pl'}} children={...} />
```

To change a language you need to use `TransContext` and call `changeLanguage`.

```tsx
import { useTransContext } from '@nerimity/solid-18lite';

const Component = () => {
  const [, { changeLanguage }] = useTransContext();

  return (
    <article>
      <button type="button" onClick={() => changeLanguage('en')}>
        English
      </button>
      <button type="button" onClick={() => changeLanguage('lt')}>
        Lietuvių
      </button>
    </article>
  );
};
```

### T Function

**i18next** have `t` function, which is essential and sometimes there is need to use it without `<Trans />` component.
`TransContext` provides it in case you need it.

```tsx
const Component = () => {
  const [t] = useTransContext();
  const messages = {
    get greeting() {
      return t('greeting', 'Hello!');
    },
    get bye() {
      return t('bye', 'Bye!');
    },
  };

  return <>{isLogin() ? messages.greeting : messages.bye}</>;
};
```

## Interpolation

Default interpolation uses `{{` and `}}` as prefix and suffix. Solid uses `{` and `}` for properties propagation. In that case
messages with default interpolation must be put as string. Placeholder values should be provided
through `options` property of `<Trans />` component.

```tsx
<Trans key="greeting" options={{ name: 'John Doe' }}>
  {'Hello {{name}}!'}
</Trans>
```

**i18next** also allows to define custom interpolation prefix and suffix.

```tsx
const resources = { lt: { greeting: 'Labas, ##name##!' } };
const interpolation = { prefix: '##', suffix: '##' };

<TransProvider options={{ interpolation, resources }}>
  <Trans key="greeting" options={{ name: 'John Doe' }}>
    Hello ##name##!
  </Trans>
</TransProvider>;
```

### Nested JSX

This library supports nested JSX messages, like [react-i18next](https://react.i18next.com/latest/trans-component). If you want use this feature, you need to install [html-parse-string](https://github.com/ryansolid/html-parse-string) separately:

```sh
npm i html-parse-string
```

Then you can define your translation strings, like described in [How to get the correct translation string?](https://react.i18next.com/latest/trans-component#how-to-get-the-correct-translation-string).

```tsx
const resources = {
  lt: { translation: { greeting_nested: '<0>Sveiki, {{fullName}}! </0><1>Tavo profilis</1>.' } },
};

<TransProvider options={{ interpolation, resources }}>
  <Trans key="greeting_nested" options={{ name: 'John Doe' }}>
    {'Hello {{ name }}! '}
    <a href="/profile">Your Profile</a>.
  </Trans>
</TransProvider>;
```

Keep in mind that elements, with interpolation, must be a string, e.g: `'Hello {{name}}!'`.

## API

### Components

#### `<TransProvider />`

| Property | Description                                                                                      | Required |
| -------- | ------------------------------------------------------------------------------------------------ | -------- |
| instance | i18next instance, see: [i18n](https://www.i18next.com/overview/api)                              | No       |
| lng      | default language, `options.lng` overrides it                                                     | No       |
| options  | i18next init options, see: [InitOptions](https://www.i18next.com/overview/configuration-options) | No       |

#### `<Trans />`

| Property | Description                                                                                                               | Required |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| key      | translation key or keys [TFunctionKeys](https://www.i18next.com/translation-function/essentials)                          | Yes      |
| options  | t function's options, see: [TOptions \| string](https://www.i18next.com/translation-function/essentials#overview-options) | No       |

### Utilities

#### `useTransContext`

`useTransContext` function returns `TransContext` as array: `[TFunction, TransProviderActions]`.

The first item is `t` function, second - the list of actions, which are listed below.

`TransProviderActions`

| Function                                                                                                                                         | Description                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| addResources(<br/>&nbsp;&nbsp;lng, <br/>&nbsp;&nbsp;ns, <br/>&nbsp;&nbsp;resources, <br/>&nbsp;&nbsp;bundleOptions?: { deep?; overwrite? }<br/>) | adds translation resources, see [addResourcesBundle](https://www.i18next.com/overview/api#addresourcebundle) |
| changeLanguage(lng)                                                                                                                              | changes language and sets new t function                                                                     |
| getI18next                                                                                                                                       | returns **i18next** instance, see [i18n](https://www.i18next.com/overview/api)                               |
