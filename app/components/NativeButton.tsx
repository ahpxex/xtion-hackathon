import { ButtonHTMLAttributes } from 'react';

interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function NativeButton({ children, className = '', ...props }: NativeButtonProps) {
  const baseClasses = "px-2 py-1 border border-gray-400 bg-gray-200 text-black rounded-sm hover:bg-gray-300 active:bg-gray-400 cursor-pointer text-sm";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
