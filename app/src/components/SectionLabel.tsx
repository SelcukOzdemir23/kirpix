import type { ReactNode } from 'react';

/** The one uppercase mono layer in the interface, used for every section name. */
export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[12px] tracking-[0.13em] text-muted uppercase">{children}</span>
  );
}
