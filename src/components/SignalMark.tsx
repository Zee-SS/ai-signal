interface SignalMarkProps {
  className?: string;
  title?: string;
}

export function SignalMark({ className, title }: SignalMarkProps) {
  const labelled = Boolean(title);
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : "true"}
      aria-label={title}
    >
      <circle cx="14" cy="34" r="4" fill="currentColor" />
      <path d="M14 24a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 14a20 20 0 0 1 20 20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.72" />
      <path d="M14 5a29 29 0 0 1 29 29" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.38" />
    </svg>
  );
}
