declare global {
  interface Window {
    api: {
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<any>;
      getStats: () => Promise<any>;
      updateStats: (stats: any) => Promise<any>;
      minimize: () => void;
      close: () => void;
      toggleCompactMode: () => void;
      isCompactMode: () => Promise<boolean>;
    updateMenubarTimer: (timeRemaining: number, isRunning: boolean, totalTime?: number) => void;
    };
  }
}

export {};