import type { ButtonHTMLAttributes } from 'react';

/**
 * The control kinds of feature 007 (research R4). Each looks different from
 * the others without relying on colour: a filled block, a bordered box, an
 * underline, a red border. Selected state is a bar on the leading edge plus a
 * tint, so it reads in greyscale too.
 *
 * - `primary`: the one action of the screen. Only one per screen state.
 * - `secondary`: everything else that does something.
 * - `quiet`: small, reversible actions inside running text; always underlined.
 * - `danger`: removes something the user cannot get back.
 */
export type ButtonKind = 'primary' | 'secondary' | 'quiet' | 'danger';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: ButtonKind;
  /** For toggles: draws the selected state (FR-016). */
  selected?: boolean;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ' +
  'disabled:opacity-45 disabled:pointer-events-none';

const KINDS: Record<ButtonKind, string> = {
  primary:
    'rounded-[6px] border border-text bg-text px-4 py-2 text-[15px] font-semibold text-surface ' +
    'hover:bg-text/88 active:translate-y-px',
  secondary:
    'rounded-[6px] border border-edge bg-surface px-3 py-1.5 text-[14px] text-text ' +
    'hover:bg-surface-2 active:bg-line',
  quiet:
    'px-0.5 text-[14px] text-text underline decoration-1 underline-offset-[3px] ' +
    'hover:decoration-2',
  danger:
    'rounded-[6px] border border-danger bg-surface px-3 py-1.5 text-[14px] text-danger ' +
    'hover:bg-danger/10',
};

const SELECTED = 'border-l-[3px] border-l-accent bg-accent-dim font-semibold';

export default function Button({ kind = 'secondary', selected, className = '', ...rest }: Props) {
  const classes = [BASE, KINDS[kind], selected ? SELECTED : '', className].join(' ');
  return <button type="button" aria-pressed={selected} {...rest} className={classes} />;
}
