import React from 'react';

interface ControlButtonsProps {
  isRunning: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isRunning,
  mode,
  onStart,
  onPause,
  onReset,
}) => {
  return (
    <div className="control-buttons">
      {!isRunning ? (
        <button 
          className={`control-btn primary ${mode === 'work' ? 'work' : 'break'}`}
          onClick={onStart}
        >
          {mode === 'work' ? '작업 시작' : '휴식 시작'}
        </button>
      ) : (
        <button 
          className="control-btn pause"
          onClick={onPause}
        >
          일시정지
        </button>
      )}
      
      <button 
        className="control-btn secondary"
        onClick={onReset}
      >
        리셋
      </button>
    </div>
  );
};

export default ControlButtons;