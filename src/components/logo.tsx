type LogoProps = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

export function Logo({ size = 24, className, withWordmark = false, wordmarkClassName }: LogoProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M20 3 L34 11 L34 28 L20 36 L6 28 L6 11 Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 22 L28 12 L20 21 Z" fill="currentColor" opacity="0.95" />
        <path d="M12 22 L20 21 L23 28 Z" fill="currentColor" opacity="0.55" />
      </svg>
      {withWordmark && (
        <span className={wordmarkClassName} style={{ fontWeight: 700, letterSpacing: "-0.3px" }}>
          WarmBlue
        </span>
      )}
    </span>
  );
}
