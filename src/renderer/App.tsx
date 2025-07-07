import React, { useState, useEffect, useCallback } from "react";
import { useTimer } from "./hooks/useTimer";
import { useSettings } from "./hooks/useSettings";
import { useFocusHistory } from "./hooks/useFocusHistory";
import { useTimerCompletion } from "./hooks/useTimerCompletion";
import { CircularTimer } from "./components/Timer/CircularTimer";
import { ControlButtons } from "./components/Timer/ControlButtons";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { FocusHistorySidebar } from "./components/Sidebar/FocusHistorySidebar";
import { SidebarToggle } from "./components/Sidebar/SidebarToggle";
import { WindowControls } from "./components/Window/WindowControls";

const App: React.FC = () => {
  const { settings, updateSettings, currentColor, setCurrentColor } = useSettings();
  const { focusHistory, sessionGroups, totalFocusTime, addFocusRecord, deleteFocusRecord, clearAllRecords } = useFocusHistory();

  const {
    timeRemaining,
    isRunning,
    isPaused,
    isTimerComplete,
    timerMode,
    sessionCount,
    sessionStartTime,
    hasRecorded,
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
    currentWorkDuration,
    currentBreakDuration,
  } = useTimer(settings);

  // UI 상태
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isCompactMode, setIsCompactMode] = useState(false);

  // 윈도우 포커스 상태 감지
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // 컴팩트 모드 상태 확인
  useEffect(() => {
    const checkCompactMode = async () => {
      console.log("Checking compact mode, window.api:", window.api);
      if (window.api?.isCompactMode) {
        try {
          const compact = await window.api.isCompactMode();
          console.log("Compact mode from main:", compact);
          setIsCompactMode(compact);
          
          // 컴팩트 모드 상태가 바뀔 때는 React 상태로만 관리
        } catch (error) {
          console.error("Error getting compact mode:", error);
        }
      } else {
        console.error("window.api is not available during init");
      }
    };

    // 즉시 실행하고 약간의 지연을 두고 다시 확인
    checkCompactMode();
    
    const timer = setTimeout(() => {
      checkCompactMode();
    }, 500); // 더 긴 지연시간으로 변경

    return () => clearTimeout(timer);
  }, []);

  // 메인 프로세스로부터 컴팩트 모드 설정 받기
  useEffect(() => {
    const handleSetCompactMode = (event: any, compact: boolean) => {
      console.log("Received compact mode from main:", compact);
      setIsCompactMode(compact);
      
      // React 상태로만 관리 - DOM 조작 제거
    };

    // IPC 리스너 등록
    if (window.api) {
      (window as any).electronAPI?.on?.('set-compact-mode', handleSetCompactMode);
    }

    return () => {
      // 클린업
      if (window.api) {
        (window as any).electronAPI?.removeListener?.('set-compact-mode', handleSetCompactMode);
      }
    };
  }, []);

  // 휴식 완료 핸들러
  const handleBreakComplete = useCallback(() => {
    setIsTimerComplete(false);
    setTimerMode("work");
    const seconds = currentWorkDuration * 60;
    setTimeRemaining(seconds);
    setHasRecorded(false);

    if (settings.autoStartNext) {
      setIsRunning(true);
      setIsPaused(false);
      setSessionStartTime(new Date());
    }
  }, [settings.autoStartNext, setTimerMode, setTimeRemaining, currentWorkDuration]);

  // 타이머 완료 처리
  useTimerCompletion({
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
  });

  // 시간 포맷팅
  const getCurrentSessionTime = (): string => {
    const now = new Date();
    const endTime = new Date(now.getTime() + timeRemaining * 1000);

    const formatTimeDisplay = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${ampm} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
    };

    return `${formatTimeDisplay(now)} → ${formatTimeDisplay(endTime)}`;
  };

  // 버튼 색상 결정
  const getButtonColor = () => {
    return currentColor;
  };

  // 타이머 모드 텍스트 결정
  const getTimerModeText = () => {
    return timerMode === "work" ? "작업 시간" : "휴식 시간";
  };

  // 타이머 모드 색상 결정
  const getTimerModeColor = () => {
    return currentColor;
  };

  // 윈도우 컨트롤
  const handleMinimize = () => {
    if (window.api) window.api.minimize();
  };

  const handleClose = () => {
    if (window.api) window.api.close();
  };

  const handleToggleCompactMode = () => {
    console.log("Toggling compact mode, current state:", isCompactMode);
    console.log("Available properties on window:", Object.keys(window));
    console.log("window.api:", window.api);
    console.log("typeof window.api:", typeof window.api);

    const newCompactState = !isCompactMode;
    
    // 우선 상태만 변경해보기
    setIsCompactMode(newCompactState);
    console.log("New state will be:", newCompactState);

    // React 상태로만 관리 - DOM 조작 제거

    // 다양한 방법으로 IPC 호출 시도
    let ipcCallSuccess = false;

    // 방법 1: window.api 사용
    if (window.api?.toggleCompactMode) {
      console.log("Method 1: Calling window.api.toggleCompactMode");
      try {
        window.api.toggleCompactMode();
        ipcCallSuccess = true;
      } catch (e) {
        console.error("Method 1 failed:", e);
      }
    }

    // 방법 2: require('electron')를 통한 직접 호출 시도
    if (!ipcCallSuccess) {
      try {
        console.log("Method 2: Trying direct electron ipc");
        const { ipcRenderer } = (window as any).require("electron");
        ipcRenderer.send("toggle-compact-mode");
        ipcCallSuccess = true;
        console.log("Method 2 success");
      } catch (e) {
        console.error("Method 2 failed:", e);
      }
    }

    // 방법 3: electronAPI fallback
    if (!ipcCallSuccess) {
      try {
        console.log("Method 3: Trying electronAPI fallback");
        (window as any).electronAPI?.send?.("toggle-compact-mode");
        console.log("Method 3 attempted");
      } catch (e) {
        console.error("Method 3 failed:", e);
      }
    }

    if (!ipcCallSuccess) {
      console.error("All IPC methods failed. window.api details:");
      console.error("window.api type:", typeof window.api);
      if (window.api) {
        console.error("api methods:", Object.keys(window.api));
      }
    }
  };

  // 타이머 편집
  const handleTimeClick = () => {
    if (!isRunning) {
      setIsEditing(true);
      setEditValue(Math.floor(timeRemaining / 60).toString());
    }
  };

  const handleTimeSubmit = () => {
    const minutes = parseInt(editValue);
    if (!isNaN(minutes) && minutes >= 0 && minutes <= 60) {
      const seconds = minutes * 60;
      setTimeRemaining(seconds);
      setIsRunning(false);
      setIsPaused(false);
      setIsTimerComplete(false);
      setTimerMode("work");
      setHasRecorded(false);
    }
    setIsEditing(false);
    setEditValue("");
  };

  const handleTimeCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleTimeChange = (minutes: number) => {
    const seconds = minutes * 60;
    setTimeRemaining(seconds);
  };

  // 빠른 시간 설정
  const handleQuickTimeSelect = (minutes: number) => {
    const seconds = minutes * 60;
    setTimeRemaining(seconds);
    updateSettings({ workDuration: minutes });
    setIsRunning(false);
    setIsPaused(false);
    setIsTimerComplete(false);
    setTimerMode("work");
    setHasRecorded(false);
  };

  // 모든 기록 삭제
  const handleClearAllRecords = () => {
    clearAllRecords();
    setSessionCount(0);
  };

  return (
    <div className={`relative w-screen h-screen app-container ${isCompactMode ? 'compact-mode' : ''}`}>
      {/* 메인 타이머 영역 */}
      <div
        className={`${
          isCompactMode ? "w-full h-full" : "w-full h-full"
        } bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl shadow-2xl flex flex-col items-center ${
          isCompactMode ? "pt-2 pb-2 px-2" : "pt-12 pb-6 px-6"
        } font-system relative transition-all duration-300`}
      >
        {/* 윈도우 컨트롤 */}
        <WindowControls isWindowFocused={isWindowFocused} onMinimize={handleMinimize} onClose={handleClose} isCompactMode={isCompactMode} />

        {/* 원형 타이머 */}
        <CircularTimer
          timeRemaining={timeRemaining}
          isRunning={isRunning}
          isPaused={isPaused}
          timerMode={timerMode}
          currentColor={currentColor}
          isEditing={isEditing}
          editValue={editValue}
          isCompactMode={isCompactMode}
          onTimeClick={handleTimeClick}
          onEditSubmit={handleTimeSubmit}
          onEditCancel={handleTimeCancel}
          onEditValueChange={setEditValue}
          onTimeChange={handleTimeChange}
          onStart={start}
          onPause={pause}
          onReset={reset}
        />

        {/* 타이머 모드 표시 */}
        {!isCompactMode && (
          <div className="mb-2 text-sm font-semibold text-center" style={{ color: getTimerModeColor() }}>
            {getTimerModeText()}
            {sessionCount > 0 && ` (${sessionCount + 1}세션)`}
          </div>
        )}

        {/* 세션 시간 표시 */}
        {!isCompactMode && (
          <div className="mb-4 text-xs font-medium text-center text-gray-600">
            {timeRemaining > 0 ? getCurrentSessionTime() : "시간을 설정해주세요"}
          </div>
        )}

        {/* 컨트롤 버튼 */}
        {!isCompactMode && (
          <ControlButtons
            isRunning={isRunning}
            isPaused={isPaused}
            isTimerComplete={isTimerComplete}
            timerMode={timerMode}
            autoStartBreak={settings.autoStartBreak}
            timeRemaining={timeRemaining}
            buttonColor={getButtonColor()}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onStartBreak={startBreak}
          />
        )}

        {/* 설정 패널 */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            currentColor={currentColor}
            isRunning={isRunning}
            onUpdateSettings={updateSettings}
            onColorChange={setCurrentColor}
            onClose={() => setShowSettings(false)}
            onQuickTimeSelect={handleQuickTimeSelect}
          />
        )}
      </div>

      {/* 컴팩트 모드 버튼 */}
      {(!isCompactMode || isWindowFocused) && (
        <div className={`absolute ${isCompactMode ? "left-2 bottom-2" : "left-2 bottom-2"} z-25`}>
          <button
            onClick={handleToggleCompactMode}
            className={`flex items-center justify-center ${isCompactMode ? 'w-8 h-8' : 'w-10 h-10'} border rounded-full cursor-pointer bg-white/90 border-black/10`}
            title={isCompactMode ? "일반 모드로 전환" : "컴팩트 모드로 전환"}
          >
            <svg width={isCompactMode ? "12" : "16"} height={isCompactMode ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              {isCompactMode ? (
                // 확대 아이콘 (일반 모드로 전환)
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              ) : (
                // 축소 아이콘 (컴팩트 모드로 전환)
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              )}
            </svg>
          </button>
        </div>
      )}

      {/* 설정 버튼 */}
      {!isCompactMode && (
        <div className={`absolute right-4 ${isCompactMode ? "top-6" : "top-12"} z-25`}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-center w-10 h-10 border rounded-full cursor-pointer bg-white/90 border-black/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      )}

      {/* 컴팩트 모드 우하단 컨트롤 버튼 */}
      {isCompactMode && isWindowFocused && (
        <div className="absolute bottom-2 right-2 flex gap-1 z-25">
          {/* 재생/일시정지 버튼 */}
          <button
            onClick={isRunning ? pause : start}
            className="w-8 h-8 rounded-full border border-gray-300 hover:scale-105 transition-all duration-150 flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: isRunning ? '#fed7d7' : `${currentColor}20`,
              color: isRunning ? '#c53030' : currentColor
            }}
            title={isRunning ? "일시정지" : "시작"}
          >
            {isRunning ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          
          {/* 정지 버튼 - 타이머가 실행 중이거나 일시정지된 상태일 때만 표시 */}
          {(isRunning || isPaused) && (
            <button
              onClick={reset}
              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 border border-gray-300 hover:scale-105 transition-all duration-150 flex items-center justify-center shadow-sm text-red-600"
              title="정지"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 사이드바 토글 버튼 */}
      {!isCompactMode && <SidebarToggle isOpen={showSidebar} onToggle={() => setShowSidebar(!showSidebar)} />}

      {/* 집중 기록 사이드바 */}
      {!isCompactMode && (
        <FocusHistorySidebar
          isOpen={showSidebar}
          focusHistory={focusHistory}
          sessionGroups={sessionGroups}
          totalFocusTime={totalFocusTime}
          sessionCount={sessionCount}
          buttonColor={getButtonColor()}
          onClose={() => setShowSidebar(false)}
          onDeleteRecord={deleteFocusRecord}
          onClearAll={handleClearAllRecords}
        />
      )}
    </div>
  );
};

export default App;
