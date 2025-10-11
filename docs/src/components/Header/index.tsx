import { navigationSignal } from '#/signals';
import type { VoidComponent } from 'solid-js';
import { github, header, heading, menu, opened } from './styles.module.css';

export const Header: VoidComponent = () => {
  const [isOpened, setOpened] = navigationSignal;

  return (
    <header class={header}>
      <button
        class={menu}
        classList={{ [opened]: isOpened() }}
        type="button"
        onclick={() => setOpened(!isOpened())}
      ></button>
      <h1 class={heading}>
        @nerimity/solid-i18lite / Examples{' '}
        <a class={github} href="https://github.com/nerimity/solid-i18lite">
          Github
        </a>
      </h1>
    </header>
  );
};
