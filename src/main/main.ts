import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import Store from "electron-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store() as any;

let mainWindow: BrowserWindow | null;
let tray: Tray | null;

const isDev = process.argv.includes("--dev");

let isCompactMode = false;

// Store를 사용하여 컴팩트 모드 상태 저장
const getCompactModeFromStore = () => {
  return store.get("isCompactMode", false) as boolean;
};

const saveCompactModeToStore = (mode: boolean) => {
  store.set("isCompactMode", mode);
};

function createWindow() {
  // 저장된 컴팩트 모드 상태 로드
  isCompactMode = getCompactModeFromStore();

  const preloadPath = path.join(__dirname, "../preload/preload.js");
  console.log("Preload path:", preloadPath);
  console.log("Preload file exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: isCompactMode ? 235 : 400,
    height: isCompactMode ? 230 : 550,
    minWidth: 235,
    minHeight: 230,
    maxWidth: 800,
    maxHeight: 1000,
    resizable: false,
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    title: "Pomodoro Timer",
    center: true,
    show: true,
    alwaysOnTop: false,
    backgroundColor: "#f8f9fa",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: preloadPath,
      webSecurity: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // 항상 개발자 도구를 열어서 오류 확인
  mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  // 임시로 시스템 트레이 비활성화 (아이콘이 준비될 때까지)
  return;
  /*
  const iconPath = path.join(__dirname, '../assets/images/icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Pomodoro Timer');
  tray.setContextMenu(contextMenu);
  */
}

// macOS 앱 이름 설정
app.setName("Pomodoro Timer");

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("minimize-window", () => {
  mainWindow?.minimize();
});

ipcMain.on("close-window", () => {
  mainWindow?.close();
});

ipcMain.on("toggle-compact-mode", () => {
  console.log("toggle-compact-mode called, current state:", isCompactMode);
  if (mainWindow) {
    // 현재 창 위치 저장
    const [x, y] = mainWindow.getPosition();
    
    isCompactMode = !isCompactMode;
    console.log("New compact mode state:", isCompactMode);

    // 상태 저장
    saveCompactModeToStore(isCompactMode);

    if (isCompactMode) {
      console.log("Setting size to compact: 235x230");
      // 컴팩트 모드: 작은 크기로 변경
      mainWindow.setMinimumSize(235, 230);
      mainWindow.setMaximumSize(800, 1000);
      mainWindow.setSize(235, 230, false); // animate를 false로 설정
      mainWindow.setPosition(x, y); // 원래 위치로 복원
    } else {
      console.log("Setting size to normal: 400x550");
      // 일반 모드: 기본 크기로 변경
      mainWindow.setMinimumSize(235, 230);
      mainWindow.setMaximumSize(800, 1000);
      mainWindow.setSize(400, 550, false); // animate를 false로 설정
      mainWindow.setPosition(x, y); // 원래 위치로 복원
    }

    console.log("Window resized at position:", x, y);
  } else {
    console.error("mainWindow is not available");
  }
});

ipcMain.handle("is-compact-mode", () => {
  return isCompactMode;
});

ipcMain.handle("get-settings", () => {
  return store.get("settings", {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: true,
    autoStartWork: false,
    soundEnabled: true,
  });
});

ipcMain.handle("save-settings", (event, settings) => {
  store.set("settings", settings);
  return true;
});

ipcMain.handle("get-stats", () => {
  return store.get("stats", {
    totalSessions: 0,
    totalMinutes: 0,
    dailyStats: {},
  });
});

ipcMain.handle("update-stats", (event, stats) => {
  store.set("stats", stats);
  return true;
});

// 메뉴바 타이머 업데이트
ipcMain.on("update-menubar-timer", (event, timeRemaining, isRunning, totalTime) => {
  if (mainWindow) {
    if (isRunning && timeRemaining > 0) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // 진행률 계산 (0~1)
      const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
      
      // 진행률을 윈도우에 설정 (macOS Dock에 표시됨)
      mainWindow.setProgressBar(progress);
      
      mainWindow.setTitle(`🍅 ${timeString}`);
    } else {
      mainWindow.setTitle("Pomodoro Timer");
      mainWindow.setProgressBar(-1); // 진행률 숨김
    }
  }
});
