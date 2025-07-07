import { useEffect } from 'react';
import { TimerSettings, TimerMode } from './useTimer';

interface UseTimerCompletionProps {
  isTimerComplete: boolean;
  hasRecorded: boolean;
  timerMode: TimerMode;
  sessionStartTime: Date | null;
  sessionCount: number;
  settings: TimerSettings;
  currentWorkDuration: number;
  currentBreakDuration: number;
  addFocusRecord: (type: 'work' | 'break', duration: number, sessionStartTime?: Date | null) => void;
  setHasRecorded: (recorded: boolean) => void;
  setTimerMode: (mode: TimerMode) => void;
  setSessionCount: (count: number | ((prev: number) => number)) => void;
  setTimeRemaining: (time: number) => void;
  setIsTimerComplete: (complete: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setSessionStartTime: (time: Date | null) => void;
  handleBreakComplete: () => void;
}

export const useTimerCompletion = ({
  isTimerComplete,
  hasRecorded,
  timerMode,
  sessionStartTime,
  sessionCount,
  settings,
  currentWorkDuration,
  currentBreakDuration,
  addFocusRecord,
  setHasRecorded,
  setTimerMode,
  setSessionCount,
  setTimeRemaining,
  setIsTimerComplete,
  setIsRunning,
  setIsPaused,
  setSessionStartTime,
  handleBreakComplete,
}: UseTimerCompletionProps) => {
  useEffect(() => {
    if (isTimerComplete && !hasRecorded) {
      setHasRecorded(true);
      
      if (timerMode === 'work') {
        // 작업 완료 기록 추가
        const completedDuration = sessionStartTime
          ? (new Date().getTime() - sessionStartTime.getTime()) / 1000
          : currentWorkDuration * 60;
        addFocusRecord('work', completedDuration, sessionStartTime);
        
        // 항상 휴식 모드로 전환
        setTimeout(() => {
          setTimerMode('break');
          setSessionCount(prev => prev + 1);
          const newSessionCount = sessionCount + 1;
          const breakDuration = newSessionCount % settings.longBreakInterval === 0 
            ? settings.longBreakDuration 
            : currentBreakDuration;
          const seconds = breakDuration * 60;
          setTimeRemaining(seconds);
          setIsTimerComplete(false);
          setHasRecorded(false);
          
          // 휴식 자동 시작 설정에 따라 자동 시작 여부 결정
          if (settings.autoStartBreak) {
            setIsRunning(true);
            setIsPaused(false);
            setSessionStartTime(new Date());
          } else {
            setIsRunning(false);
            setIsPaused(false);
            setSessionStartTime(null);
          }
        }, 1000);
      } else if (timerMode === 'break') {
        // 휴식 완료 기록 추가
        const breakDuration = sessionCount % settings.longBreakInterval === 0 
          ? settings.longBreakDuration 
          : currentBreakDuration;
        const completedDuration = sessionStartTime
          ? (new Date().getTime() - sessionStartTime.getTime()) / 1000
          : breakDuration * 60;
        addFocusRecord('break', completedDuration, sessionStartTime);
        setTimeout(() => handleBreakComplete(), 1000);
      }
    }
  }, [
    isTimerComplete, 
    hasRecorded, 
    timerMode, 
    sessionStartTime, 
    sessionCount, 
    settings,
    addFocusRecord,
    setHasRecorded,
    setTimerMode,
    setSessionCount,
    setTimeRemaining,
    setIsTimerComplete,
    setIsRunning,
    setIsPaused,
    setSessionStartTime,
    handleBreakComplete,
  ]);
};