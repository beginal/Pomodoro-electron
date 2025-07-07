export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak';
  timeRemaining: number;
  isRunning: boolean;
  sessionsCompleted: number;
}

export interface Settings {
  workTime: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

export interface Stats {
  totalSessions: number;
  totalMinutes: number;
  dailyStats: {
    [date: string]: {
      sessions: number;
      minutes: number;
    };
  };
}

export interface ElectronAPI {
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  getStats: () => Promise<Stats>;
  updateStats: (stats: Stats) => Promise<boolean>;
  minimize: () => void;
  close: () => void;
  isCompactMode: () => Promise<boolean>;
  toggleCompactMode: () => void;
  updateMenubarTimer: (timeRemaining: number, isRunning: boolean, totalTime: number) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}