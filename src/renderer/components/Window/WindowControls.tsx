import React from "react";

interface WindowControlsProps {
  isWindowFocused: boolean;
  onMinimize: () => void;
  onClose: () => void;
  isCompactMode?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ isWindowFocused, onMinimize, onClose, isCompactMode = false }) => {
  return (
    <div
      className={`absolute top-0 left-0 right-0 h-7 ${isCompactMode ? 'bg-transparent' : 'bg-gradient-to-b from-gray-240 to-gray-232'} rounded-t-2xl flex justify-center items-center z-[1002] ${isCompactMode ? '' : 'border-b border-gray-208'}`}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* 중앙 타이틀 */}
      {!isCompactMode && (
        <div className="text-sm font-medium text-center text-gray-800">Pomodoro Timer</div>
      )}
    </div>
  );
};
