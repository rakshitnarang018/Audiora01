
import React from 'react';

type LoadingSpinnerProps = {
  size?: 'small' | 'medium' | 'large';
};

const sizes = {
  small: 'w-4 h-4 border-2',
  medium: 'w-8 h-8 border-3',
  large: 'w-12 h-12 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} rounded-full border-t-transparent border-song-purple animate-spin`}
        style={{ 
          boxShadow: '0 0 15px rgba(156, 92, 246, 0.5)',
          background: 'linear-gradient(45deg, rgba(156, 92, 246, 0.1), rgba(79, 172, 254, 0.1))'
        }}
        role="status"
        aria-label="loading"
      />
      <div 
        className={`absolute ${sizes[size]} rounded-full animate-pulse`}
        style={{
          background: 'radial-gradient(circle, rgba(156, 92, 246, 0.2) 0%, rgba(156, 92, 246, 0) 70%)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
