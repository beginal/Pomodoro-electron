import { useState, useEffect } from 'react';
import { TimerSettings } from './useTimer';

export interface UseSettingsReturn {
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  autoStartNext: false,
  autoStartBreak: false,
};

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  const [currentColor, setCurrentColor] = useState(() => {
    return localStorage.getItem('pomodoroColor') || 'rgb(238, 28, 46)';
  });

  // 설정 저장
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // 색상 저장
  useEffect(() => {
    localStorage.setItem('pomodoroColor', currentColor);
  }, [currentColor]);

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
    currentColor,
    setCurrentColor,
  };
};