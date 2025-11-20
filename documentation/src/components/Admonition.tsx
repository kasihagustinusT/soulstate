import React from 'react';
import clsx from 'clsx';

interface AdmonitionProps {
  type?: 'note' | 'tip' | 'info' | 'success' | 'warning' | 'caution' | 'danger';
  title?: string;
  children: React.ReactNode;
}

const typeMap = {
  note: {
    icon: '📝',
    className: 'bg-blue-900/20 border-blue-500 text-blue-200',
    defaultTitle: 'Note',
  },
  tip: {
    icon: '💡',
    className: 'bg-green-900/20 border-green-500 text-green-200',
    defaultTitle: 'Tip',
  },
  info: {
    icon: 'ℹ️',
    className: 'bg-blue-900/20 border-blue-500 text-blue-200',
    defaultTitle: 'Info',
  },
  success: {
    icon: '✅',
    className: 'bg-green-900/20 border-green-500 text-green-200',
    defaultTitle: 'Success',
  },
  warning: {
    icon: '⚠️',
    className: 'bg-yellow-900/20 border-yellow-500 text-yellow-200',
    defaultTitle: 'Warning',
  },
  caution: {
    icon: '⚠️',
    className: 'bg-yellow-900/20 border-yellow-500 text-yellow-200',
    defaultTitle: 'Caution',
  },
  danger: {
    icon: '🔥',
    className: 'bg-red-900/20 border-red-500 text-red-200',
    defaultTitle: 'Danger',
  },
};

export function Admonition({ type = 'info', title, children }: AdmonitionProps) {
  const { icon, className, defaultTitle } = typeMap[type];
  const finalTitle = title || defaultTitle;

  return (
    <div
      className={clsx(
        'my-6 p-4 border-l-4 rounded-r-lg',
        className
      )}
    >
      <div className="flex items-start">
        <div className="text-xl mr-3">{icon}</div>
        <div className="flex-1">
          {finalTitle && <h4 className="font-bold text-white mt-0 mb-2">{finalTitle}</h4>}
          <div className="prose prose-invert max-w-none text-inherit">{children}</div>
        </div>
      </div>
    </div>
  );
}
