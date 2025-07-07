import React from 'react';

const WindowControls: React.FC = () => {
  const handleMinimize = () => {
    window.api.minimize();
  };

  const handleClose = () => {
    window.api.close();
  };

  return (
    <div className="window-controls">
      <div className="window-title">Pomodoro Timer</div>
      <div className="window-buttons">
        <button 
          className="window-btn minimize"
          onClick={handleMinimize}
        >
          －
        </button>
        <button 
          className="window-btn close"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default WindowControls;