import { Example, LanguageSwitcher } from '#/components';
import i18next, { type InitOptions } from '@nerimity/i18lite';
import { Trans, TransProvider } from '@nerimity/solid-i18lite';
import type { VoidComponent } from 'solid-js';

const NestedPage: VoidComponent = () => {
  const options: InitOptions = {
    debug: true,
    lng: 'en',
    resources: {
      lt: { translation: { greeting_nested: '<0>Sveiki, {{fullName}}! </0><1>Tavo profilis</1>.' } },
    },
  };

  return (
    <TransProvider options={options} instance={i18next.createInstance()}>
      <h2>Nested</h2>
      <p>Set resources through TransProvider options:</p>
      <Example>{`<TransProvider options={ resources: { lt: { translation: { greeting_nested: '<0>Sveiki, {{fullName}}! </0><1>Tavo profilis</1>.' } } } />`}</Example>

      <LanguageSwitcher />

      <Example
        translation={
          <Trans key="greeting_nested" options={{ fullName: 'John Doe' }}>
            {'Hello {{ fullName }}! '}
            <a href="/profile">Your Profile</a>.
          </Trans>
        }
      >
        {`<Trans key="greeting_nested" options={{ fullName: 'John Doe' }}> {'Hello {{ fullName }}! '} <a href="/profile">Your Profile</a>. </Trans>`}
      </Example>
    </TransProvider>
  );
};

export default NestedPage;
