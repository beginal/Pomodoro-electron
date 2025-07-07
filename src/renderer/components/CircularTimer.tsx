import React, { useRef, useEffect, useState } from 'react';

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  onTimeChange: (minutes: number) => void;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  timeRemaining,
  totalTime,
  isRunning,
  mode,
  onTimeChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAngle, setDragAngle] = useState(0);

  const radius = 120;
  const strokeWidth = 8;
  const center = 150;
  const circumference = 2 * Math.PI * radius;
  
  const progress = (totalTime - timeRemaining) / totalTime;
  const strokeDashoffset = circumference - progress * circumference;
  const passedStrokeDashoffset = circumference - progress * circumference;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRunning) {
      setIsDragging(true);
      updateAngleFromMouse(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && svgRef.current) {
      updateAngleFromMouse(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateAngleFromMouse = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const minutes = Math.round((normalizedAngle / (2 * Math.PI)) * 60);
    
    onTimeChange(Math.max(1, Math.min(60, minutes)));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const modeColors = {
    work: '#4CAF50',
    shortBreak: '#2196F3',
    longBreak: '#FF9800',
  };

  const color = modeColors[mode];

  return (
    <div className="circular-timer">
      <svg
        ref={svgRef}
        width="300"
        height="300"
        className="timer-svg"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : isRunning ? 'default' : 'grab' }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`${color}40`}
          strokeWidth={strokeWidth}
          strokeDasharray={progress * circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s ease' }}
        />
        
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => {
          const angle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
          const x1 = center + (radius - 15) * Math.cos(angle);
          const y1 = center + (radius - 15) * Math.sin(angle);
          const x2 = center + (radius - 5) * Math.cos(angle);
          const y2 = center + (radius - 5) * Math.sin(angle);
          
          return (
            <line
              key={minute}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#999"
              strokeWidth={minute % 15 === 0 ? 2 : 1}
            />
          );
        })}
        
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="timer-text"
          fontSize="48"
          fill="#333"
        >
          {formatTime(timeRemaining)}
        </text>
        
        <text
          x={center}
          y={center + 35}
          textAnchor="middle"
          dominantBaseline="middle"
          className="mode-text"
          fontSize="14"
          fill="#666"
        >
          {mode === 'work' ? 'Work' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </text>
      </svg>
    </div>
  );
};

export default CircularTimer;