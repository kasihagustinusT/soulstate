import React from 'react';

interface CalloutProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
}

const typeClasses = {
  info: {
    bg: 'bg-blue-900/20 border-blue-500',
    icon: '💡',
  },
  warning: {
    bg: 'bg-yellow-900/20 border-yellow-500',
    icon: '⚠️',
  },
  danger: {
    bg: 'bg-red-900/20 border-red-500',
    icon: '🔥',
  },
  success: {
    bg: 'bg-green-900/20 border-green-500',
    icon: '✅',
  },
};

export function Callout({ children, type = 'info', title }: CalloutProps) {
  const classes = typeClasses[type];

  return (
    <div className={`my-6 p-4 border-l-4 rounded-r-lg ${classes.bg}`}>
      <div className="flex items-start">
        <div className="text-xl mr-3">{classes.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-bold text-white mt-0 mb-2">{title}</h4>}
          <div className="text-gray-300 prose-p:my-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
