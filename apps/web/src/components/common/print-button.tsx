'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="cursor-pointer text-sm text-muted-foreground hover:text-foreground print:hidden"
    >
      Print this page
    </button>
  );
}
