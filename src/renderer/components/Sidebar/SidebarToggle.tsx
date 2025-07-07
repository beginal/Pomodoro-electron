import React from 'react';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[990]">
      <button
        onClick={onToggle}
        className="w-7.5 h-15 bg-white/90 border border-black/10 rounded-l-2xl cursor-pointer flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
          <path 
            d="M15 18l-6-6 6-6" 
            className="transition-transform duration-300"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} 
          />
        </svg>
      </button>
    </div>
  );
};