import React from 'react';

function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="floating-button group"
      aria-label="Agregar gasto"
    >
      <svg 
        className="w-6 h-6 transition-transform duration-300 group-hover:rotate-45" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
    </button>
  );
}

export default FloatingActionButton;