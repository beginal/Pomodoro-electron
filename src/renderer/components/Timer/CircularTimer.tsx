import React, { useState, useEffect } from 'react';
import { TimerMode } from '../../hooks/useTimer';


interface CircularTimerProps {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  timerMode: TimerMode;
  currentColor: string;
  isEditing: boolean;
  editValue: string;
  isCompactMode?: boolean;
  onTimeClick: () => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
  onTimeChange: (minutes: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  timeRemaining,
  isRunning,
  isPaused,
  timerMode,
  currentColor,
  isEditing,
  editValue,
  isCompactMode = false,
  onTimeClick,
  onEditSubmit,
  onEditCancel,
  onEditValueChange,
  onTimeChange,
  onStart,
  onPause,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isPaused) return '#9E9E9E';
    return currentColor;
  };

  const currentMinutes = timeRemaining / 60;
  const remainingAngle = Math.min((currentMinutes / 60) * 360, 359.9);
  const radius = isCompactMode ? 85 : 120;
  const centerX = isCompactMode ? 105 : 170;
  const centerY = isCompactMode ? 105 : 170;
  const startAngle = -90;
  const endAngle = startAngle + remainingAngle;

  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  const largeArcFlag = remainingAngle > 180 ? 1 : 0;
  const pathData = [
    `M ${centerX} ${centerY}`,
    `L ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    'Z'
  ].join(' ');

  const updateTimeFromMouse = (clientX: number, clientY: number) => {
    const svg = document.querySelector('.timer-svg') as SVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerXPos = rect.left + rect.width / 2;
    const centerYPos = rect.top + rect.height / 2;

    const angle = Math.atan2(clientY - centerYPos, clientX - centerXPos);
    const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const rawMinutes = (normalizedAngle / (2 * Math.PI)) * 60;

    let minutes = Math.round(rawMinutes);
    if (rawMinutes >= 59.33) minutes = 60;

    const clampedMinutes = Math.max(0, Math.min(60, minutes));
    onTimeChange(clampedMinutes);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRunning && !isEditing) {
      const svg = document.querySelector('.timer-svg') as SVGElement;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const centerXPos = rect.left + rect.width / 2;
      const centerYPos = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(e.clientX - centerXPos, 2) + Math.pow(e.clientY - centerYPos, 2)
      );

      if (distance > 45) {
        setIsDragging(true);
        updateTimeFromMouse(e.clientX, e.clientY);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateTimeFromMouse(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSubmit();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };


  return (
    <div 
      className={`${isCompactMode ? 'mb-4 mt-0.5' : 'mb-10'} rounded-full ${isCompactMode ? '' : 'shadow-lg'} relative`}
    >
      <svg
        width={isCompactMode ? "210" : "340"}
        height={isCompactMode ? "210" : "340"}
        className={`timer-svg ${isDragging ? 'cursor-grabbing' : !isRunning ? 'cursor-grab' : 'cursor-default'} select-none`}
        onMouseDown={handleMouseDown}
      >
        {/* 배경 원 */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius} 
          fill="#f8f9fa" 
          stroke="#dee2e6" 
          strokeWidth="2" 
        />

        {/* 진행률 표시 */}
        {timeRemaining > 0 && (
          <>
            {remainingAngle >= 359.9 ? (
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill={getTimerColor()}
                opacity="0.8"
                className={isRunning && !isDragging ? 'transition-all duration-300 ease-out' : ''}
              />
            ) : (
              <path
                d={pathData}
                fill={getTimerColor()}
                opacity="0.8"
                className={isRunning && !isDragging ? 'transition-all duration-300 ease-out' : ''}
              />
            )}
          </>
        )}

        {/* 눈금 */}
        {Array.from({ length: 60 }, (_, i) => {
          const minute = i;
          const angle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
          const isMainTick = minute % 5 === 0;
          const tickLength = isMainTick ? (isCompactMode ? 10 : 18) : (isCompactMode ? 5 : 10);
          const x1 = centerX + (radius - tickLength) * Math.cos(angle);
          const y1 = centerY + (radius - tickLength) * Math.sin(angle);
          const x2 = centerX + (radius - (isCompactMode ? 1 : 3)) * Math.cos(angle);
          const y2 = centerY + (radius - (isCompactMode ? 1 : 3)) * Math.sin(angle);

          return (
            <line
              key={`tick-${minute}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#495057"
              strokeWidth={isMainTick ? (isCompactMode ? 3.5 : 3) : (isCompactMode ? 2 : 1.5)}
            />
          );
        })}

        {/* 숫자 마킹 */}
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => {
          const angle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
          const textRadius = radius + (isCompactMode ? 12 : 20);
          const x = centerX + textRadius * Math.cos(angle);
          const y = centerY + textRadius * Math.sin(angle);

          return (
            <text
              key={minute}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isCompactMode ? "10" : "14"}
              fill="#212529"
              fontWeight="700"
            >
              {minute}
            </text>
          );
        })}

        {/* 중앙 원 */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={isCompactMode ? "25" : "45"} 
          fill="white" 
          stroke="#dee2e6" 
          strokeWidth="3"
          className="transition-all duration-200"
          onClick={isCompactMode ? undefined : onTimeClick}
        />

        {/* 시간 표시 */}
        {isEditing ? (
          <foreignObject 
            x={centerX - (isCompactMode ? 20 : 35)} 
            y={centerY - (isCompactMode ? 7 : 12)} 
            width={isCompactMode ? "40" : "70"} 
            height={isCompactMode ? "14" : "24"}
          >
            <input
              type="number"
              value={editValue}
              onChange={e => onEditValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={onEditSubmit}
              min="0"
              max="60"
              className={`w-full h-full text-center ${isCompactMode ? 'text-xs' : 'text-lg'} font-bold border border-gray-300 rounded outline-none bg-white`}
              autoFocus
            />
          </foreignObject>
        ) : (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isCompactMode ? "12" : "24"}
            fill="#212529"
            fontWeight="700"
            onClick={isCompactMode ? undefined : onTimeClick}
            className={!isRunning && !isCompactMode ? 'cursor-pointer' : 'cursor-default'}
          >
            {formatTime(timeRemaining)}
          </text>
        )}
      </svg>
      
    </div>
  );
};