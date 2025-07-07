import React, { useState, useEffect } from "react";

// 사이드바 애니메이션을 위한 스타일
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// This file is no longer used - types are now in src/types/index.ts

const App: React.FC = () => {
  // 설정을 먼저 로드
  const [settings, setSettings] = useState(() => {
    // localStorage에서 설정 로드
    const savedSettings = localStorage.getItem("pomodoroSettings");
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      soundEnabled: true,
      autoStartNext: false,
      autoStartBreak: false,
    };
  });

  // 설정된 작업 시간을 기반으로 초기화
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const workDuration = settings.workDuration;
    // 테스트용: 1분을 5초로 변경
    return workDuration === 1 ? 5 : workDuration * 60;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // 일시정지 상태 추가
  const [isChangingTime, setIsChangingTime] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [currentColor, setCurrentColor] = useState(() => {
    return localStorage.getItem("pomodoroColor") || "rgb(238, 28, 46)";
  });
  const [showSettings, setShowSettings] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [sessionCount, setSessionCount] = useState(() => {
    // localStorage에서 세션 카운트 로드
    const savedSessionCount = localStorage.getItem("pomodoroSessionCount");
    if (savedSessionCount) {
      return parseInt(savedSessionCount);
    }
    return 0;
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [focusHistory, setFocusHistory] = useState<
    Array<{
      id: number;
      date: string;
      startTime: string;
      endTime: string;
      duration: number;
      type: "work" | "break";
    }>
  >(() => {
    // localStorage에서 기록 로드
    const savedHistory = localStorage.getItem("pomodoroFocusHistory");
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
    return [];
  });
  const [totalFocusTime, setTotalFocusTime] = useState(() => {
    // localStorage에서 총 집중 시간 로드
    const savedTotalTime = localStorage.getItem("pomodoroTotalFocusTime");
    if (savedTotalTime) {
      return parseInt(savedTotalTime);
    }
    return 0;
  });

  // 세션 시작 시간 저장
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === 1) {
            // 타이머 완료
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

  // 타이머 완료 처리
  useEffect(() => {
    if (isTimerComplete && !hasRecorded) {
      setHasRecorded(true);
      
      if (timerMode === "work") {
        // 작업 완료 기록 추가
        const completedDuration = sessionStartTime
          ? (new Date().getTime() - sessionStartTime.getTime()) / 1000
          : settings.workDuration === 1
          ? 5
          : settings.workDuration * 60;
        addFocusRecord("work", completedDuration);
        
        // 휴식 자동 시작 기능
        if (settings.autoStartBreak) {
          setTimeout(() => {
            setTimerMode("break");
            setSessionCount(prev => prev + 1);
            const newSessionCount = sessionCount + 1;
            const breakDuration = newSessionCount % settings.longBreakInterval === 0 ? settings.longBreakDuration : settings.shortBreakDuration;
            const seconds = breakDuration === 1 ? 5 : breakDuration * 60;
            setTimeRemaining(seconds);
            setIsTimerComplete(false);
            setIsRunning(true);
            setIsPaused(false);
            setSessionStartTime(new Date());
            setHasRecorded(false);
          }, 1000);
        }
      } else if (timerMode === "break") {
        // 휴식 완료 기록 추가
        const breakDuration = sessionCount % settings.longBreakInterval === 0 ? settings.longBreakDuration : settings.shortBreakDuration;
        const completedDuration = sessionStartTime
          ? (new Date().getTime() - sessionStartTime.getTime()) / 1000
          : breakDuration === 1
          ? 5
          : breakDuration * 60;
        addFocusRecord("break", completedDuration);
        setTimeout(() => handleBreakComplete(), 1000);
      }
    }
  }, [isTimerComplete, hasRecorded, timerMode, sessionStartTime, sessionCount, settings]);

  // 설정 저장
  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, [settings]);

  // 설정이 변경될 때 타이머 시간 업데이트 (작업 모드이고 실행 중이 아닐 때만)
  useEffect(() => {
    if (timerMode === "work" && !isRunning && !isPaused) {
      const workDuration = settings.workDuration;
      // 테스트용: 1분을 5초로 변경
      const seconds = workDuration === 1 ? 5 : workDuration * 60;
      setTimeRemaining(seconds);
    }
  }, [settings.workDuration, timerMode, isRunning, isPaused]);

  // 색상 저장
  useEffect(() => {
    localStorage.setItem("pomodoroColor", currentColor);
  }, [currentColor]);

  // 집중 기록 저장
  useEffect(() => {
    localStorage.setItem("pomodoroFocusHistory", JSON.stringify(focusHistory));
  }, [focusHistory]);

  // 총 집중 시간 저장
  useEffect(() => {
    localStorage.setItem("pomodoroTotalFocusTime", totalFocusTime.toString());
  }, [totalFocusTime]);

  // 세션 카운트 저장
  useEffect(() => {
    localStorage.setItem("pomodoroSessionCount", sessionCount.toString());
  }, [sessionCount]);

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

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 현재 시간 + 설정된 시간 계산
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

  // 빨간색 부채꼴 영역 계산 (남은 시간에 비례)
  const currentMinutes = timeRemaining / 60; // 현재 남은 시간 (분 단위, 소수점 포함)
  const remainingAngle = Math.min((currentMinutes / 60) * 360, 359.9); // 남은 시간에 해당하는 각도 (360도 미만으로 제한)
  const radius = 120; // 반지름 축소

  // 부채꼴을 위한 SVG path 계산
  const centerX = 170;
  const centerY = 170;
  const startAngle = -90; // 12시 방향부터 시작
  const endAngle = startAngle + remainingAngle;

  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  const largeArcFlag = remainingAngle > 180 ? 1 : 0;

  const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, "Z"].join(" ");

  // 현재 타이머 모드에 따른 색상 결정
  const getTimerColor = () => {
    if (isPaused) {
      return "#9E9E9E"; // 일시정지 시 회색
    }
    if (timerMode === "break") {
      return "#4CAF50"; // 초록색
    }
    return currentColor; // 사용자가 선택한 색상
  };

  // 버튼용 색상 (일시정지 상태와 관계없이 원래 색상)
  const getButtonColor = () => {
    if (timerMode === "break") {
      return "#4CAF50"; // 초록색
    }
    return currentColor; // 사용자가 선택한 색상
  };

  const timerColor = getTimerColor();
  const buttonColor = getButtonColor();

  // 집중 기록 추가
  const addFocusRecord = (type: "work" | "break", duration: number) => {
    const now = new Date();
    const startTime = sessionStartTime || new Date(now.getTime() - duration * 1000);

    const record = {
      id: Date.now(), // 고유 ID 추가
      date: now.toLocaleDateString("ko-KR"),
      startTime: startTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      endTime: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      duration: Math.floor(duration / 60), // 분 단위
      type: type,
    };

    setFocusHistory(prev => [record, ...prev]);

    if (type === "work") {
      setTotalFocusTime(prev => prev + Math.floor(duration / 60));
    }
  };

  // 집중 기록 삭제
  const deleteFocusRecord = (id: number) => {
    setFocusHistory(prev => {
      const recordToDelete = prev.find(record => record.id === id);
      if (recordToDelete && recordToDelete.type === "work") {
        setTotalFocusTime(prevTime => Math.max(0, prevTime - recordToDelete.duration));
      }
      return prev.filter(record => record.id !== id);
    });
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setIsTimerComplete(false);
    setSessionStartTime(new Date());
    setHasRecorded(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsTimerComplete(false);
    setTimerMode("work");
    setSessionCount(0);
    setHasRecorded(false);
    handleTimeChange(settings.workDuration);
  };

  const handleStartBreak = () => {
    setTimerMode("break");
    setSessionCount(prev => prev + 1);
    const breakDuration = (sessionCount + 1) % settings.longBreakInterval === 0 ? settings.longBreakDuration : settings.shortBreakDuration;
    // 테스트용: 1분을 5초로 변경
    const seconds = breakDuration === 1 ? 5 : breakDuration * 60;
    setTimeRemaining(seconds);
    setIsTimerComplete(false);

    // 휴식 시작 버튼을 누르면 항상 바로 시작
    setIsRunning(true);
    setIsPaused(false);
    setSessionStartTime(new Date());
    setHasRecorded(false);
  };

  const handleBreakComplete = () => {
    setIsTimerComplete(false); // 먼저 완료 상태 해제
    setTimerMode("work");
    // 테스트용: 1분을 5초로 변경
    const seconds = settings.workDuration === 1 ? 5 : settings.workDuration * 60;
    setTimeRemaining(seconds);
    setHasRecorded(false);

    if (settings.autoStartNext) {
      setIsRunning(true);
      setIsPaused(false);
      setSessionStartTime(new Date());
    }
  };

  const handleTimeChange = (minutes: number) => {
    setIsChangingTime(true);
    // 테스트용: 1분을 5초로 변경
    const seconds = minutes === 1 ? 5 : minutes * 60;
    setTimeRemaining(seconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsTimerComplete(false);
    setTimerMode("work");
    setHasRecorded(false);
    // 짧은 딜레이 후 애니메이션 상태 해제
    setTimeout(() => setIsChangingTime(false), 100);
  };

  // 드래그 관련 함수들
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRunning && !isEditing) {
      // 중앙 원 영역 체크
      const svg = document.querySelector(".timer-svg") as SVGElement;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const centerXPos = rect.left + rect.width / 2;
      const centerYPos = rect.top + rect.height / 2;

      const distance = Math.sqrt(Math.pow(e.clientX - centerXPos, 2) + Math.pow(e.clientY - centerYPos, 2));

      // 중앙 원 영역(반지름 45)을 제외하고 드래그 허용
      if (distance > 45) {
        setIsDragging(true);
        updateTimeFromMouse(e.clientX, e.clientY);
      }
    }
  };

  const updateTimeFromMouse = (clientX: number, clientY: number) => {
    const svg = document.querySelector(".timer-svg") as SVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    // 12시 방향을 0도로 조정 (-90도 offset)
    const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const rawMinutes = (normalizedAngle / (2 * Math.PI)) * 60;

    // 정수 분으로 반올림
    let minutes = Math.round(rawMinutes);

    // 59.x분 이상이면 60분으로 설정
    if (rawMinutes >= 59.33) {
      // 59분 20초 = 59.33분
      minutes = 60;
    }

    // 0분 ~ 60분 범위로 제한
    const clampedMinutes = Math.max(0, Math.min(60, minutes));
    setTimeRemaining(clampedMinutes * 60); // 정확히 분 단위로만 저장
  };

  // 마우스 이벤트 핸들러들
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
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleMinimize = () => {
    if (window.api) {
      window.api.minimize();
    }
  };

  const handleClose = () => {
    if (window.api) {
      window.api.close();
    }
  };

  // 직접 입력 관련 함수들
  const handleTimeClick = () => {
    if (!isRunning) {
      setIsEditing(true);
      setEditValue(Math.floor(timeRemaining / 60).toString());
    }
  };

  const handleTimeSubmit = () => {
    const minutes = parseInt(editValue);
    if (!isNaN(minutes) && minutes >= 0 && minutes <= 60) {
      handleTimeChange(minutes);
    }
    setIsEditing(false);
    setEditValue("");
  };

  const handleTimeCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTimeSubmit();
    } else if (e.key === "Escape") {
      handleTimeCancel();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 메인 타이머 영역 */}
      <div
        style={{
          width: "500px",
          height: "650px",
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 30px 30px 30px",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: "relative",
        }}
      >
        {/* macOS 스타일 타이틀바 */}
        <div
          style={
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "28px",
              background: "linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%)",
              borderRadius: "10px 10px 0 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1002,
              WebkitAppRegion: "drag",
              borderBottom: "1px solid #d0d0d0",
            } as React.CSSProperties
          }
        >
          {/* 왼쪽 트래픽 라이트 버튼들 */}
          <div
            style={
              {
                position: "absolute",
                left: "10px",
                display: "flex",
                gap: "8px",
                WebkitAppRegion: "no-drag",
              } as React.CSSProperties
            }
          >
            <button
              onClick={handleClose}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: isWindowFocused ? "#ff5f57" : "#c4c4c4",
                border: isWindowFocused ? "0.5px solid #e0443e" : "0.5px solid #a0a0a0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                if (isWindowFocused) {
                  e.currentTarget.style.background = "#ff4037";
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = isWindowFocused ? "#ff5f57" : "#c4c4c4";
              }}
            />
            <button
              onClick={handleMinimize}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: isWindowFocused ? "#ffbd2e" : "#c4c4c4",
                border: isWindowFocused ? "0.5px solid #dea123" : "0.5px solid #a0a0a0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                if (isWindowFocused) {
                  e.currentTarget.style.background = "#ffaa00";
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = isWindowFocused ? "#ffbd2e" : "#c4c4c4";
              }}
            />
            <button
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: isWindowFocused ? "#28ca42" : "#c4c4c4",
                border: isWindowFocused ? "0.5px solid #1aad29" : "0.5px solid #a0a0a0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                if (isWindowFocused) {
                  e.currentTarget.style.background = "#1fb037";
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = isWindowFocused ? "#28ca42" : "#c4c4c4";
              }}
            />
          </div>

          {/* 중앙 타이틀 */}
          <div
            style={{
              fontSize: "13px",
              color: "#333",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Pomodoro Timer
          </div>
        </div>

        {/* 원형 타이머 */}
        <div
          style={{
            marginBottom: "40px",
            borderRadius: "50%",
            boxShadow: "0 3px 5px rgba(0,0,0,0.12), inset 0 3px 3px rgba(0,0,0,0.05)",
          }}
        >
          <svg
            width="340"
            height="340"
            className="timer-svg"
            onMouseDown={handleMouseDown}
            style={{
              cursor: isDragging ? "grabbing" : !isRunning ? "grab" : "default",
              userSelect: "none",
            }}
          >
            {/* 배경 원 */}
            <circle cx={centerX} cy={centerY} r={radius} fill="#f8f9fa" stroke="#dee2e6" strokeWidth="2" />

            {/* 빨간색 부채꼴 영역 (숫자/눈금 뒤에 그리기) */}
            {timeRemaining > 0 && (
              <>
                {remainingAngle >= 359.9 ? (
                  // 60분일 때는 전체 원으로 표시
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill={timerColor}
                    opacity="0.8"
                    style={{ transition: isRunning && !isChangingTime && !isDragging ? "all 0.3s ease" : "none" }}
                  />
                ) : (
                  // 그 외에는 부채꼴로 표시
                  <path
                    d={pathData}
                    fill={timerColor}
                    opacity="0.8"
                    style={{ transition: isRunning && !isChangingTime && !isDragging ? "all 0.3s ease" : "none" }}
                  />
                )}
              </>
            )}

            {/* 작은 눈금 */}
            {Array.from({ length: 60 }, (_, i) => {
              const minute = i;
              const angle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
              const isMainTick = minute % 5 === 0;
              const tickLength = isMainTick ? 18 : 10;
              const x1 = centerX + (radius - tickLength) * Math.cos(angle);
              const y1 = centerY + (radius - tickLength) * Math.sin(angle);
              const x2 = centerX + (radius - 3) * Math.cos(angle);
              const y2 = centerY + (radius - 3) * Math.sin(angle);

              return <line key={`tick-${minute}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#495057" strokeWidth={isMainTick ? 3 : 1.5} />;
            })}

            {/* 숫자 마킹 (0~55분) - 원 밖으로 이동 */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => {
              const angle = (minute / 60) * 2 * Math.PI - Math.PI / 2; // 12시 방향부터 시작
              const textRadius = radius + 20; // 타이머 쪽으로 살짝 이동
              const x = centerX + textRadius * Math.cos(angle);
              const y = centerY + textRadius * Math.sin(angle);

              return (
                <text key={minute} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#212529" fontWeight="700">
                  {minute}
                </text>
              );
            })}

            {/* 중앙 흰 원 */}
            <circle cx={centerX} cy={centerY} r="45" fill="white" stroke="#dee2e6" strokeWidth="3" />

            {/* 시간 표시 또는 입력 필드 */}
            {isEditing ? (
              <foreignObject x={centerX - 35} y={centerY - 12} width="70" height="24">
                <input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleTimeSubmit}
                  min="0"
                  max="60"
                  style={{
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "700",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    outline: "none",
                    background: "white",
                  }}
                  autoFocus
                />
              </foreignObject>
            ) : (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                fill="#212529"
                fontWeight="700"
                onClick={handleTimeClick}
                style={{ cursor: !isRunning ? "pointer" : "default" }}
              >
                {formatTime(timeRemaining)}
              </text>
            )}
          </svg>
        </div>

        {/* 타이머 모드 표시 */}
        <div
          style={{
            marginBottom: "10px",
            textAlign: "center",
            color: timerColor,
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          {timerMode === "work" ? "작업 시간" : "휴식 시간"}
          {sessionCount > 0 && ` (${sessionCount + 1}세션)`}
        </div>

        {/* 세션 시간 표시 */}
        <div
          style={{
            marginBottom: "20px",
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {timeRemaining > 0 ? getCurrentSessionTime() : "시간을 설정해주세요"}
        </div>

        {/* 컨트롤 버튼 */}
        <div style={{ display: "flex", gap: "15px" }}>
          {isTimerComplete && timerMode === "work" && !settings.autoStartBreak && timeRemaining === 0 ? (
            <button
              onClick={handleStartBreak}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "12px 52px",
                borderRadius: "10px",
                fontSize: "22px",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s",
              }}
            >
              휴식 시작
            </button>
          ) : !isRunning && !isPaused ? (
            <button
              onClick={handleStart}
              style={{
                background: buttonColor,
                color: "white",
                border: "none",
                padding: "12px 62px",
                borderRadius: "10px",
                fontSize: "22px",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s",
              }}
            >
              {timerMode === "work" ? "시작" : "휴식 시작"}
            </button>
          ) : !isRunning && isPaused ? (
            <>
              <button
                onClick={handleStart}
                style={{
                  background: buttonColor,
                  color: "white",
                  border: "none",
                  padding: "12px 62px",
                  borderRadius: "10px",
                  fontSize: "22px",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s",
                }}
              >
                재개
              </button>
              <button
                onClick={handleReset}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "12px 62px",
                  borderRadius: "10px",
                  fontSize: "22px",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s",
                }}
              >
                리셋
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePause}
                style={{
                  background: "#FF9800",
                  color: "white",
                  border: "none",
                  padding: "12px 42px",
                  borderRadius: "10px",
                  fontSize: "22px",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s",
                }}
              >
                일시정지
              </button>
              <button
                onClick={handleReset}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "12px 62px",
                  borderRadius: "10px",
                  fontSize: "22px",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s",
                }}
              >
                리셋
              </button>
            </>
          )}
        </div>

        {/* 설정 패널 */}
        {showSettings && (
          <div
            style={{
              position: "absolute",
              top: "50px",
              left: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "15px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
            }}
          >
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "-10px",
                  width: "12px",
                  height: "12px",
                  background: "#ff5f57",
                  border: "0.5px solid #e0443e",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.1s",
                  fontSize: "10px",
                  color: "#8b0000",
                  fontWeight: "bold",
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = "#ff4037";
                  e.currentTarget.innerHTML = "×";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "#ff5f57";
                  e.currentTarget.innerHTML = "";
                }}
              />
              <h3 style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#333", textAlign: "center" }}>설정</h3>
            </div>

            {/* 타이머 시간 설정 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>타이머 시간 (분)</h4>
              <div style={{ display: "flex", gap: "15px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#888", marginBottom: "5px" }}>작업</label>
                  <input
                    type="number"
                    value={settings.workDuration}
                    onChange={e => setSettings({ ...settings, workDuration: Number(e.target.value) })}
                    min="1"
                    max="90"
                    style={{
                      width: "60px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#888", marginBottom: "5px" }}>짧은 휴식</label>
                  <input
                    type="number"
                    value={settings.shortBreakDuration}
                    onChange={e => setSettings({ ...settings, shortBreakDuration: Number(e.target.value) })}
                    min="1"
                    max="30"
                    style={{
                      width: "60px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#888", marginBottom: "5px" }}>긴 휴식</label>
                  <input
                    type="number"
                    value={settings.longBreakDuration}
                    onChange={e => setSettings({ ...settings, longBreakDuration: Number(e.target.value) })}
                    min="1"
                    max="60"
                    style={{
                      width: "60px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#888", marginBottom: "5px" }}>긴 휴식 간격</label>
                  <input
                    type="number"
                    value={settings.longBreakInterval}
                    onChange={e => setSettings({ ...settings, longBreakInterval: Number(e.target.value) })}
                    min="2"
                    max="10"
                    style={{
                      width: "60px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 빠른 설정 버튼 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>빠른 설정</h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[5, 15, 25, 30, 45, 60].map(time => (
                  <button
                    key={time}
                    onClick={() => {
                      // 테스트용: 1분을 5초로 변경
                      const actualTime = time === 1 ? 5 : time * 60;
                      setTimeRemaining(actualTime);
                      setSettings({ ...settings, workDuration: time });
                      setIsRunning(false);
                      setIsPaused(false);
                      setIsTimerComplete(false);
                      setTimerMode("work");
                      setHasRecorded(false);
                    }}
                    disabled={isRunning}
                    style={{
                      background: isRunning ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.8)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      padding: "6px 12px",
                      borderRadius: "15px",
                      fontSize: "12px",
                      cursor: isRunning ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: isRunning ? 0.5 : 1,
                    }}
                    onMouseOver={e => !isRunning && (e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)")}
                    onMouseOut={e => !isRunning && (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
                  >
                    {time}분
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 선택 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>테마 색상</h4>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { name: "빨강", color: "rgb(238, 28, 46)" },
                  { name: "파랑", color: "rgb(33, 150, 243)" },
                  { name: "보라", color: "rgb(156, 39, 176)" },
                  { name: "오렌지", color: "rgb(255, 152, 0)" },
                ].map(({ name, color }) => (
                  <button
                    key={name}
                    onClick={() => setCurrentColor(color)}
                    style={{
                      background: color,
                      border: currentColor === color ? "3px solid #333" : "1px solid rgba(0, 0, 0, 0.1)",
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: currentColor === color ? "0 0 0 2px rgba(0, 0, 0, 0.1)" : "none",
                    }}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* 알림 설정 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>알림</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label style={{ fontSize: "14px", color: "#333" }}>사운드 알림</label>
              </div>
            </div>

            {/* 자동 시작 설정 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>자동 시작</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "14px", color: "#333" }}>휴식 자동 시작</label>
                  <div
                    onClick={() => setSettings({ ...settings, autoStartBreak: !settings.autoStartBreak })}
                    style={{
                      width: "44px",
                      height: "24px",
                      borderRadius: "12px",
                      background: settings.autoStartBreak ? buttonColor : "#ccc",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        top: "2px",
                        left: settings.autoStartBreak ? "22px" : "2px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "14px", color: "#333" }}>다음 작업 세션 자동 시작</label>
                  <div
                    onClick={() => setSettings({ ...settings, autoStartNext: !settings.autoStartNext })}
                    style={{
                      width: "44px",
                      height: "24px",
                      borderRadius: "12px",
                      background: settings.autoStartNext ? buttonColor : "#ccc",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        top: "2px",
                        left: settings.autoStartNext ? "22px" : "2px",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 설정 버튼 */}
      <div
        style={{
          position: "absolute",
          left: "30px",
          top: "50px",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* 사이드바 토글 버튼 */}
      <div
        style={{
          position: "fixed",
          right: "0",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 990,
        }}
      >
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            width: "30px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "15px 0 0 15px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={e => (e.currentTarget.style.background = "rgba(255, 255, 255, 1)")}
          onMouseOut={e => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" style={{ transform: showSidebar ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }} />
          </svg>
        </button>
      </div>

      {/* 사이드바 오버레이 */}
      {showSidebar && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "rgba(0, 0, 0, 0.1)",
            zIndex: 998,
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 집중 기록 사이드바 */}
      {showSidebar && (
        <div
          style={{
            position: "fixed",
            right: "0",
            top: "28px",
            width: "320px",
            height: "calc(650px - 28px)",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "0 0 0 20px",
            boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
            padding: "30px 20px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backdropFilter: "blur(10px)",
            overflowY: "auto",
            zIndex: 999,
            animation: "slideInRight 0.3s ease-out",
          }}
          onClick={e => e.stopPropagation()}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600", color: "#333" }}>집중 기록</h2>

          {/* 오늘의 통계 */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.7)",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "20px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "500", color: "#666" }}>오늘의 집중 시간</h3>
            <div style={{ fontSize: "24px", fontWeight: "700", color: buttonColor }}>
              {Math.floor(totalFocusTime / 60)}시간 {totalFocusTime % 60}분
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>완료된 세션: {sessionCount}개</div>
          </div>

          {/* 집중 기록 목록 */}
          <div>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "600", color: "#333" }}>최근 활동</h3>
            {focusHistory.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  fontSize: "14px",
                  padding: "40px 20px",
                }}
              >
                아직 완료된 세션이 없습니다.
                <br />첫 번째 집중 세션을 시작해보세요!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {focusHistory.map(record => (
                  <div
                    key={record.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.8)",
                      borderRadius: "8px",
                      padding: "12px",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      fontSize: "13px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          color: record.type === "work" ? buttonColor : "#4CAF50",
                        }}
                      >
                        {record.type === "work" ? "작업" : "휴식"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#666" }}>{record.duration}분</span>
                        <button
                          onClick={() => deleteFocusRecord(record.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "18px",
                            height: "18px",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={e => (e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.1)")}
                          onMouseOut={e => (e.currentTarget.style.backgroundColor = "transparent")}
                          title="기록 삭제"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ color: "#888", fontSize: "11px" }}>
                      {record.startTime} - {record.endTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 모든 기록 삭제 버튼 */}
            {focusHistory.length > 0 && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  onClick={() => {
                    if (confirm("모든 집중 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                      setFocusHistory([]);
                      setTotalFocusTime(0);
                      setSessionCount(0);
                    }
                  }}
                  style={{
                    background: "#ff4757",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#ff3838")}
                  onMouseOut={e => (e.currentTarget.style.background = "#ff4757")}
                >
                  모든 기록 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
