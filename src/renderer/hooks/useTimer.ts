import { useState, useEffect, useCallback } from 'react';

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  soundEnabled: boolean;
  autoStartNext: boolean;
  autoStartBreak: boolean;
}

export type TimerMode = 'work' | 'break';

export interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isTimerComplete: boolean;
  timerMode: TimerMode;
  sessionCount: number;
  sessionStartTime: Date | null;
  hasRecorded: boolean;
  currentWorkDuration: number;
  currentBreakDuration: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  startBreak: () => void;
  setTimeRemaining: (time: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setSessionCount: (count: number | ((prev: number) => number)) => void;
  setIsRunning: (running: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setIsTimerComplete: (complete: boolean) => void;
  setSessionStartTime: (time: Date | null) => void;
  setHasRecorded: (recorded: boolean) => void;
}

export const useTimer = (settings: TimerSettings): UseTimerReturn => {
  // 현재 작업/휴식 시간 저장
  const [currentWorkDuration, setCurrentWorkDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoroCurrentWorkDuration');
    return saved ? parseInt(saved) : settings.workDuration;
  });
  
  const [currentBreakDuration, setCurrentBreakDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoroCurrentBreakDuration');
    return saved ? parseInt(saved) : settings.shortBreakDuration;
  });
  
  const [timeRemaining, setTimeRemaining] = useState(() => {
    return currentWorkDuration * 60;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  
  const [sessionCount, setSessionCount] = useState(() => {
    const savedSessionCount = localStorage.getItem('pomodoroSessionCount');
    return savedSessionCount ? parseInt(savedSessionCount) : 0;
  });
  
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === 1) {
            setIsRunning(false);
            setIsTimerComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  // 메뉴바 타이머 업데이트
  useEffect(() => {
    if (window.api && window.api.updateMenubarTimer) {
      const totalTime = timerMode === 'work' ? currentWorkDuration * 60 : currentBreakDuration * 60;
      window.api.updateMenubarTimer(timeRemaining, isRunning, totalTime);
    }
  }, [timeRemaining, isRunning, timerMode, currentWorkDuration, currentBreakDuration]);

  // 설정이 변경될 때만 타이머 시간 업데이트 (모드 변경 시에는 제외)
  useEffect(() => {
    if (timerMode === 'work' && !isRunning && !isPaused && !isTimerComplete) {
      const workDuration = settings.workDuration;
      const seconds = workDuration * 60;
      setTimeRemaining(seconds);
    }
  }, [settings.workDuration]); // timerMode 의존성 제거

  // 세션 카운트 저장
  useEffect(() => {
    localStorage.setItem('pomodoroSessionCount', sessionCount.toString());
  }, [sessionCount]);
  
  // 현재 작업 시간 저장
  useEffect(() => {
    localStorage.setItem('pomodoroCurrentWorkDuration', currentWorkDuration.toString());
  }, [currentWorkDuration]);
  
  // 현재 휴식 시간 저장
  useEffect(() => {
    localStorage.setItem('pomodoroCurrentBreakDuration', currentBreakDuration.toString());
  }, [currentBreakDuration]);
  
  // 타이머 값이 변경될 때 현재 값 업데이트
  useEffect(() => {
    if (isPaused || isRunning) {
      const currentMinutes = Math.ceil(timeRemaining / 60);
      if (timerMode === 'work' && currentMinutes !== currentWorkDuration) {
        setCurrentWorkDuration(currentMinutes);
      } else if (timerMode === 'break' && currentMinutes !== currentBreakDuration) {
        setCurrentBreakDuration(currentMinutes);
      }
    }
  }, [timeRemaining, timerMode, isPaused, isRunning, currentWorkDuration, currentBreakDuration]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setIsTimerComplete(false);
    setSessionStartTime(new Date());
    setHasRecorded(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsTimerComplete(false);
    setTimerMode('work');
    setSessionCount(0);
    setHasRecorded(false);
    // 설정값으로 초기화
    setCurrentWorkDuration(settings.workDuration);
    setCurrentBreakDuration(settings.shortBreakDuration);
    const seconds = settings.workDuration * 60;
    setTimeRemaining(seconds);
  }, [settings.workDuration, settings.shortBreakDuration]);

  const startBreak = useCallback(() => {
    setTimerMode('break');
    setSessionCount(prev => prev + 1);
    const newSessionCount = sessionCount + 1;
    // 긴 휴식 시간인 경우만 설정값 사용
    const breakDuration = newSessionCount % settings.longBreakInterval === 0 
      ? settings.longBreakDuration 
      : currentBreakDuration;
    const seconds = breakDuration * 60;
    setTimeRemaining(seconds);
    setIsTimerComplete(false);
    setIsRunning(true);
    setIsPaused(false);
    setSessionStartTime(new Date());
    setHasRecorded(false);
  }, [sessionCount, settings.longBreakInterval, settings.longBreakDuration, currentBreakDuration]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    isTimerComplete,
    timerMode,
    sessionCount,
    sessionStartTime,
    hasRecorded,
    currentWorkDuration,
    currentBreakDuration,
    start,
    pause,
    reset,
    startBreak,
    setTimeRemaining,
    setTimerMode,
    setSessionCount,
    setIsRunning,
    setIsPaused,
    setIsTimerComplete,
    setSessionStartTime,
    setHasRecorded,
  };
};