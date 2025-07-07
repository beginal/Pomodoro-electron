# Electron 개발자 가이드 (React 개발자를 위한)

## 1. Electron이란?

Electron은 웹 기술(HTML, CSS, JavaScript)로 데스크톱 애플리케이션을 만들 수 있게 해주는 프레임워크입니다. Chromium과 Node.js를 하나의 런타임으로 결합하여, 웹 앱을 네이티브 앱처럼 실행할 수 있습니다.

### 주요 특징
- **크로스 플랫폼**: Windows, macOS, Linux 모두 지원
- **웹 기술 사용**: React, Vue, Angular 등 익숙한 프레임워크 사용 가능
- **네이티브 API 접근**: 파일 시스템, 시스템 트레이, 알림 등 OS 기능 사용
- **자동 업데이트**: 앱 업데이트 기능 내장

## 2. Electron 아키텍처

Electron은 **Main Process**와 **Renderer Process**라는 두 가지 프로세스로 구성됩니다.

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Application                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐         ┌────────────────────┐   │
│  │   Main Process   │ ←──IPC──→ │  Renderer Process  │   │
│  │                 │         │                    │   │
│  │  • Node.js API  │         │  • Chromium       │   │
│  │  • Electron API │         │  • Web APIs       │   │
│  │  • 파일 시스템    │         │  • React App      │   │
│  │  • OS 통합       │         │  • DOM/CSS        │   │
│  └─────────────────┘         └────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Main Process (메인 프로세스)
- **역할**: 애플리케이션의 생명주기 관리, 창(BrowserWindow) 생성/관리
- **접근 가능**: Node.js API, Electron API, 네이티브 모듈
- **파일 위치**: `src/main/main.ts`
- **특징**: 
  - 하나의 애플리케이션에 하나만 존재
  - 여러 개의 Renderer Process 관리
  - 시스템 리소스 직접 접근 가능

### Renderer Process (렌더러 프로세스)
- **역할**: 웹 페이지 표시, 사용자 인터페이스 렌더링
- **접근 가능**: Web API, DOM, 제한된 Node.js API (preload 통해)
- **파일 위치**: `src/renderer/*`
- **특징**:
  - 각 BrowserWindow마다 별도의 프로세스
  - React 앱이 실행되는 곳
  - 보안상 Node.js API 직접 접근 불가

### Preload Script (프리로드 스크립트)
- **역할**: Main과 Renderer 사이의 안전한 브릿지
- **파일 위치**: `src/preload/preload.ts`
- **특징**:
  - contextBridge를 통해 안전하게 API 노출
  - Renderer에서 사용할 수 있는 API 정의

## 3. 프로젝트 구조

```
pomodoro-electron/
├── src/
│   ├── main/              # Main Process
│   │   └── main.ts        # Electron 앱 진입점
│   │
│   ├── renderer/          # Renderer Process (React 앱)
│   │   ├── index.html     # HTML 템플릿
│   │   ├── index.tsx      # React 앱 진입점
│   │   ├── App.tsx        # 루트 컴포넌트
│   │   ├── components/    # React 컴포넌트
│   │   ├── styles/        # CSS 파일
│   │   └── utils/         # 유틸리티 함수
│   │
│   ├── preload/           # Preload Scripts
│   │   └── preload.ts     # API 브릿지
│   │
│   └── types/             # TypeScript 타입 정의
│       └── index.ts       # 공통 타입
│
├── dist/                  # 빌드 출력
│   ├── main/             # 컴파일된 main process
│   └── renderer/         # 빌드된 React 앱
│
├── package.json          # 프로젝트 설정
├── tsconfig.json         # TypeScript 설정
├── tsconfig.main.json    # Main process TS 설정
└── vite.config.ts        # Vite 설정
```

## 4. 프로세스 간 통신 (IPC)

React 앱(Renderer)에서 시스템 기능을 사용하려면 IPC를 통해 Main Process와 통신해야 합니다.

### 통신 흐름
```
React Component → window.api → Preload Script → IPC → Main Process
                                                 ↓
React Component ← window.api ← Preload Script ← IPC ← Response
```

### 예제 코드

#### 1. Main Process에서 Handler 정의 (`src/main/main.ts`)
```typescript
import { ipcMain } from 'electron';

// 설정 가져오기
ipcMain.handle('get-settings', async () => {
  return store.get('settings', defaultSettings);
});

// 설정 저장하기
ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  return true;
});
```

#### 2. Preload Script에서 API 노출 (`src/preload/preload.ts`)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
});
```

#### 3. React Component에서 사용 (`src/renderer/components/Settings.tsx`)
```typescript
const Settings: React.FC = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Main Process에서 설정 가져오기
    window.api.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    // Main Process에 설정 저장
    await window.api.saveSettings(settings);
  };

  return (
    // UI 코드...
  );
};
```

## 5. 개발 워크플로우

### 개발 서버 실행
```bash
npm run dev
```
이 명령어는:
1. TypeScript로 Main Process 컴파일
2. Vite 개발 서버 시작 (React 앱)
3. Electron 앱 실행

### 파일 수정 시
- **React 코드 수정**: Vite HMR로 자동 리로드
- **Main Process 수정**: 수동으로 재시작 필요 (Ctrl+C → npm run dev)
- **Preload Script 수정**: 수동으로 재시작 필요

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 설치 파일 생성
npm run dist
```

## 6. 주요 Electron API

### BrowserWindow
```typescript
// 새 창 만들기
const window = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### Menu
```typescript
// 메뉴 만들기
const menu = Menu.buildFromTemplate([
  { label: 'File', submenu: [...] },
  { label: 'Edit', submenu: [...] }
]);
Menu.setApplicationMenu(menu);
```

### Tray (시스템 트레이)
```typescript
// 시스템 트레이 아이콘
const tray = new Tray('icon.png');
tray.setToolTip('My App');
```

### Dialog
```typescript
// 파일 선택 대화상자
const result = await dialog.showOpenDialog({
  properties: ['openFile', 'multiSelections']
});
```

## 7. React 개발자를 위한 팁

### 1. 라우팅
- React Router 사용 시 `HashRouter` 사용 권장
- `BrowserRouter`는 파일 프로토콜에서 문제 발생 가능

### 2. 상태 관리
- Redux, Zustand 등 평소처럼 사용 가능
- 영구 저장이 필요한 데이터는 `electron-store` 사용

### 3. 스타일링
- CSS Modules, Styled Components, Tailwind 모두 사용 가능
- 네이티브 느낌을 위해 OS별 스타일 고려

### 4. 보안
- `nodeIntegration: false`, `contextIsolation: true` 유지
- Remote content 로드 시 주의
- 사용자 입력 검증 필수

### 5. 디버깅
- Renderer: Chrome DevTools 사용 (평소처럼)
- Main Process: `--inspect` 플래그로 Node.js 디버거 사용

## 8. 자주 사용하는 패턴

### 파일 읽기/쓰기
```typescript
// Main Process
ipcMain.handle('read-file', async (event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

// React Component
const content = await window.api.readFile('/path/to/file');
```

### 알림 표시
```typescript
// Main Process
new Notification({
  title: '작업 완료',
  body: '뽀모도로 세션이 완료되었습니다!'
}).show();
```

### 단축키 등록
```typescript
// Main Process
globalShortcut.register('CommandOrControl+Shift+P', () => {
  // 단축키 동작
});
```

## 9. 주의사항

1. **보안**: Renderer에서 Node.js API 직접 사용 금지
2. **성능**: 무거운 작업은 Main Process에서 처리
3. **메모리**: 사용하지 않는 BrowserWindow는 반드시 정리
4. **업데이트**: electron-builder의 자동 업데이트 기능 활용

## 10. 추가 리소스

- [Electron 공식 문서](https://www.electronjs.org/docs)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - 실험용 도구
- [Electron Forge](https://www.electronforge.io/) - 보일러플레이트
- [awesome-electron](https://github.com/sindresorhus/awesome-electron) - 유용한 리소스 모음