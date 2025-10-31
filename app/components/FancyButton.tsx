import { ButtonHTMLAttributes } from 'react';

interface FancyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function FancyButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: FancyButtonProps) {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl";

  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:-translate-y-0.5",
    secondary: "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black hover:-translate-y-0.5",
    accent: "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 hover:-translate-y-0.5"
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
