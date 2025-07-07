import React, { useState } from 'react';
import { TimerMode } from '../../hooks/useTimer';

interface ControlButtonsProps {
  isRunning: boolean;
  isPaused: boolean;
  isTimerComplete: boolean;
  timerMode: TimerMode;
  autoStartBreak: boolean;
  timeRemaining: number;
  buttonColor: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStartBreak: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  isRunning,
  isPaused,
  isTimerComplete,
  timerMode,
  autoStartBreak,
  timeRemaining,
  buttonColor,
  onStart,
  onPause,
  onReset,
  onStartBreak,
}) => {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const baseButtonClasses = "px-4 py-2 rounded-lg font-medium cursor-pointer shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center";

  if (isTimerComplete && timerMode === 'work' && !autoStartBreak && timeRemaining === 0) {
    return (
      <div className="flex gap-4">
        <button
          onClick={onStartBreak}
          className={`${baseButtonClasses} bg-break-green text-white`}
        >
          {/* 휴식 시작 아이콘 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    );
  }

  if (!isRunning && !isPaused) {
    const isDisabled = timeRemaining === 0;
    return (
      <div className="flex gap-4">
        <button
          onClick={isDisabled ? undefined : onStart}
          disabled={isDisabled}
          className={`${baseButtonClasses} text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: isDisabled ? '#9ca3af' : buttonColor }}
        >
          {/* 시작 아이콘 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    );
  }

  if (!isRunning && isPaused) {
    const isDisabled = timeRemaining === 0;
    return (
      <>
        <div className="flex gap-4">
          <button
            onClick={isDisabled ? undefined : onStart}
            disabled={isDisabled}
            className={`${baseButtonClasses} text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: isDisabled ? '#9ca3af' : buttonColor }}
          >
            {/* 재개 아이콘 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button
            onClick={() => setShowStopConfirm(true)}
            className={`${baseButtonClasses} bg-red-500 text-white`}
          >
            {/* 정지 아이콘 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
        </div>

        {/* 정지 확인 모달 */}
        {showStopConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">타이머를 정지하시겠습니까?</h3>
                <p className="text-sm text-gray-600">타이머가 리셋되고 모든 진행 상황이 초기화됩니다.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onReset();
                    setShowStopConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  정지
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-4">
        <button
          onClick={onPause}
          className={`${baseButtonClasses} bg-orange-500 text-white`}
        >
          {/* 일시정지 아이콘 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        </button>
        <button
          onClick={() => setShowStopConfirm(true)}
          className={`${baseButtonClasses} bg-red-500 text-white`}
        >
          {/* 정지 아이콘 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
        </button>
      </div>

      {/* 정지 확인 모달 */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">타이머를 정지하시겠습니까?</h3>
              <p className="text-sm text-gray-600">타이머가 리셋되고 모든 진행 상황이 초기화됩니다.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowStopConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                정지
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};