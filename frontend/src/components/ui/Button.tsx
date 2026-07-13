import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium
    rounded-lg transition-all duration-150 cursor-pointer select-none
    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
  `;

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: `
      bg-emerald-600 hover:bg-emerald-500 text-white font-semibold
      shadow-sm shadow-emerald-900/30
    `,
    ghost: `
      text-slate-300 hover:text-white hover:bg-white/5
    `,
    outline: `
      border border-white/10 text-slate-300 hover:text-white
      hover:bg-white/5 hover:border-white/20
    `,
    danger: `
      border border-red-500/30 text-red-400
      hover:bg-red-500/10 hover:text-red-300
    `,
    google: `
      bg-white border border-gray-200 text-gray-700 font-medium
      hover:bg-gray-50 shadow-sm
    `,
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
