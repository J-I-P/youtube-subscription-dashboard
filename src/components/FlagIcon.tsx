import * as Flags from "country-flag-icons/react/3x2";

interface Props {
  code: string;
  className?: string;
}

export function FlagIcon({ code, className = "w-5 h-auto rounded-sm" }: Props) {
  if (!code || code.length !== 2) return null;
  const Flag = Flags[code.toUpperCase() as keyof typeof Flags];
  if (!Flag) return null;
  return <Flag className={className} aria-hidden="true" />;
}
