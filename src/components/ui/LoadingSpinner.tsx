interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const LoadingSpinner = ({ size = 'md', message }: LoadingSpinnerProps) => (
  <div className="flex flex-col items-center justify-center gap-3 p-8">
    <div className={`${sizeClasses[size]} border-2 border-slate-200 border-t-medical-green rounded-full animate-spin`} />
    {message && <p className="text-sm text-slate-500 font-medium">{message}</p>}
  </div>
);