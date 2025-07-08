import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
};

export default Card;
