import type { TFunction, TOptions } from '@nerimity/i18lite';
import { stringify } from 'html-parse-string';
import { children, type JSXElement, type ParentComponent, type ParentProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useTransContext } from './TransProvider';
import { htmlParseStringNotFoundError, parseHTML, translateJSX } from './utils/translate-jsx';

export type TransProps = {
  key: string;
  options?: TOptions;
  components?: Record<string, JSXElement | ((props: any) => JSXElement)>;
};

export const Trans: ParentComponent<TransProps> = (props) => {
  const [t, { getI18next }] = useTransContext();

  return (
    <>
      {props.components
        ? renderInterpolatedTranslation({ t, props })
        : typeof props.children === 'string'
        ? t(props.key, props.children, props.options)
        : translateJSX({ i18n: getI18next(), t, props }, children(() => props.children)() as Node[])}
    </>
  );
};

const renderInterpolatedTranslation = ({ t, props }: { t: TFunction; props: ParentProps<TransProps> }) => {
  const translatedString = t(props.key, props.options);

  if (!parseHTML) {
    htmlParseStringNotFoundError();
    return;
  }

  const [ast] = parseHTML(`<0>${translatedString}</0>`);

  return ast.children.map((node) => {
    if (node.type === 'text') {
      return node.content;
    }

    const componentKey = node.name;
    const mappedComponent = props.components?.[componentKey];

    if (!mappedComponent) {
      return node.content;
    }

    if (typeof mappedComponent === 'function') {
      return <Dynamic component={mappedComponent} children={stringify(node.children)} />;
    }

    return mappedComponent;
  });
};
