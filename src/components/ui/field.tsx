import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  error?: string[] | string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[0.8rem] font-medium text-ink-2">
        {label}
        {required && <span className="text-accent-ink" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !message && <p id={`${htmlFor}-hint`} className="text-xs text-muted">{hint}</p>}
      {message && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">
          {message}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string | undefined, invalid: boolean) => (id && invalid ? `${id}-error` : undefined);

export function Input({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={cn("field", className)} aria-invalid={invalid || undefined} aria-describedby={describedBy(props.id, !!invalid)} {...props} />;
}

export function Textarea({ className, invalid, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cn("field min-h-24 resize-y", className)} aria-invalid={invalid || undefined} aria-describedby={describedBy(props.id, !!invalid)} {...props} />;
}

export function Select({
  className,
  invalid,
  options,
  placeholder,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select className={cn("field appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239198a1' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} aria-invalid={invalid || undefined} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
