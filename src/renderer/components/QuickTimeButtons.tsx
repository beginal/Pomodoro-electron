import React from 'react';

interface QuickTimeButtonsProps {
  onTimeSelect: (minutes: number) => void;
}

const QuickTimeButtons: React.FC<QuickTimeButtonsProps> = ({ onTimeSelect }) => {
  const quickTimes = [5, 15, 25, 45, 60];

  return (
    <div className="quick-time-buttons">
      {quickTimes.map((time) => (
        <button
          key={time}
          className="quick-time-btn"
          onClick={() => onTimeSelect(time)}
        >
          {time}분
        </button>
      ))}
    </div>
  );
};

export default QuickTimeButtons;