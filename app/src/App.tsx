/**
 * T001: the shell only. One window, one empty state, no controls that pretend
 * to work. File selection arrives with T006.
 */
export default function App() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.035em]">Kirpix</h1>
      <p className="max-w-[42ch] text-center text-[14px] leading-relaxed text-muted">
        Uzun bir videodan istediğin kesiti bulur, senin makinende keser.
      </p>
    </main>
  );
}
