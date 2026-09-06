import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "gold" | "ghost" | "light";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  gold: "btn-gold",
  ghost: "btn-ghost",
  light: "bg-cream-50 text-charcoal-900 px-7 py-3.5 shadow-lift hover:bg-white hover:-translate-y-0.5 hover:shadow-gold active:translate-y-0",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

function buttonClasses({
  variant,
  size,
  className,
}: {
  variant: Variant;
  size: Size;
  className?: string;
}) {
  return cn("btn", variants[variant], sizes[size], className);
}

type AnchorProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> &
  BaseProps;

export function ButtonLink({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: AnchorProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & BaseProps) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
