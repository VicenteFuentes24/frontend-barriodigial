import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = ['button', 'button-' + variant, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
