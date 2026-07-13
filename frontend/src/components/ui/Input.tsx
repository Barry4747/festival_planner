import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-lg border bg-[#111412] py-2.5 text-sm text-white
            placeholder-slate-600 transition-colors duration-150
            focus:outline-none focus:ring-1
            ${error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500/30 hover:border-white/20'
            }
            ${icon ? 'pl-10 pr-4' : 'px-3.5'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};
