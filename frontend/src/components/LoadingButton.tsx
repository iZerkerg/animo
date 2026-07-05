import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
};

export function LoadingButton({ children, disabled, loading, loadingLabel, ...props }: Props) {
  return (
    <button {...props} aria-busy={loading} disabled={disabled || loading}>
      {loading && <span aria-hidden="true" className="button-spinner" />}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
}
