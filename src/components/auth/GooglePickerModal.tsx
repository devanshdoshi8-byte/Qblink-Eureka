import { Loader2 } from "lucide-react";

export const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.4-1.07 2.59-2.27 3.39v2.82h3.67c2.15-1.98 3.62-4.9 3.62-8.45z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.67-2.82c-1.02.69-2.32 1.1-4.28 1.1-3.29 0-6.08-2.22-7.07-5.21H1.13v2.92C3.11 21.3 7.21 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M4.93 14.16c-.25-.74-.39-1.53-.39-2.34 0-.81.14-1.6.39-2.34V6.56H1.13C.41 8.01 0 9.66 0 11.42c0 1.76.41 3.41 1.13 4.86l3.8-2.12z"
    />
    <path
      fill="#EA4335"
      d="M12 4.78c1.77 0 3.35.61 4.6 1.81l3.25-3.25C17.96 1.19 15.24 0 12 0 7.21 0 3.11 2.7 1.13 6.56l3.8 2.92C5.92 6.99 8.71 4.78 12 4.78z"
    />
  </svg>
);

/**
 * Big primary "Continue with Google" button — used as the recommended option
 * on sign-in and sign-up screens.
 */
export const GoogleButton = ({
  onClick,
  loading,
  label = "Continue with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="w-full bg-card border-2 border-border hover:border-primary/40 rounded-2xl px-4 py-4 flex items-center justify-center gap-3 text-base font-semibold text-foreground card-shadow hover:elevated-shadow transition-all disabled:opacity-60"
  >
    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleLogo className="w-5 h-5" />}
    <span>{loading ? "Connecting..." : label}</span>
    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
      Fastest
    </span>
  </button>
);

/**
 * "or continue with" divider — used between Google and the secondary methods.
 */
export const AuthDivider = ({ label = "or continue with" }: { label?: string }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
      {label}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);