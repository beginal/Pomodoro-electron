import React from 'react';
import { TimerSettings } from '../../hooks/useTimer';

interface SettingsPanelProps {
  settings: TimerSettings;
  currentColor: string;
  isRunning: boolean;
  onUpdateSettings: (settings: Partial<TimerSettings>) => void;
  onColorChange: (color: string) => void;
  onClose: () => void;
  onQuickTimeSelect: (minutes: number) => void;
}

const colorOptions = [
  { name: '빨강', color: 'rgb(238, 28, 46)' },
  { name: '파랑', color: 'rgb(33, 150, 243)' },
  { name: '보라', color: 'rgb(156, 39, 176)' },
  { name: '오렌지', color: 'rgb(255, 152, 0)' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  currentColor,
  isRunning,
  onUpdateSettings,
  onColorChange,
  onClose,
  onQuickTimeSelect,
}) => {
  const buttonColor = currentColor;

  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    color: string;
  }> = ({ checked, onChange, color }) => (
    <div
      onClick={() => onChange(!checked)}
      className="w-8 h-4 rounded-full cursor-pointer transition-all duration-300 relative"
      style={{ background: checked ? color : '#ccc' }}
    >
      <div
        className="w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md"
        style={{ left: checked ? '18px' : '2px' }}
      />
    </div>
  );

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/20 z-[999]"
        onClick={onClose}
      />
      <div className="absolute top-12 left-8 right-8 bottom-8 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-2xl z-[1000] overflow-y-auto">
      <div className="relative mb-3">
        <button
          onClick={onClose}
          className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-red-500 border border-red-600 rounded-full cursor-pointer flex items-center justify-center transition-all duration-100 text-xs text-red-900 font-bold hover:bg-red-400"
          onMouseEnter={(e) => {
            e.currentTarget.textContent = '×';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.textContent = '';
          }}
        />
        <h3 className="text-sm font-semibold text-gray-800 text-center">설정</h3>
      </div>

      {/* 타이머 시간 설정 */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-600 mb-1.5">타이머 시간 (분)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-0.5">작업</label>
            <input
              type="number"
              value={settings.workDuration}
              onChange={e => onUpdateSettings({ workDuration: Number(e.target.value) })}
              min="1"
              max="90"
              className="w-12 p-1 rounded border border-gray-300 text-center text-xs"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-0.5">짧은 휴식</label>
            <input
              type="number"
              value={settings.shortBreakDuration}
              onChange={e => onUpdateSettings({ shortBreakDuration: Number(e.target.value) })}
              min="1"
              max="30"
              className="w-12 p-1 rounded border border-gray-300 text-center text-xs"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-0.5">긴 휴식</label>
            <input
              type="number"
              value={settings.longBreakDuration}
              onChange={e => onUpdateSettings({ longBreakDuration: Number(e.target.value) })}
              min="1"
              max="60"
              className="w-12 p-1 rounded border border-gray-300 text-center text-xs"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-0.5">긴 휴식 간격</label>
            <input
              type="number"
              value={settings.longBreakInterval}
              onChange={e => onUpdateSettings({ longBreakInterval: Number(e.target.value) })}
              min="2"
              max="10"
              className="w-12 p-1 rounded border border-gray-300 text-center text-xs"
            />
          </div>
        </div>
      </div>

      {/* 빠른 설정 버튼 */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-600 mb-1.5">빠른 설정</h4>
        <div className="grid grid-cols-3 gap-1">
          {[5, 15, 25, 30, 45, 60].map(time => (
            <button
              key={time}
              onClick={() => onQuickTimeSelect(time)}
              disabled={isRunning}
              className={`px-2 py-1 rounded text-xs cursor-pointer transition-all duration-200 border border-black/10 
                ${isRunning 
                  ? 'bg-black/10 cursor-not-allowed opacity-50' 
                  : 'bg-white/80 hover:bg-black/5'
                }`}
            >
              {time}분
            </button>
          ))}
        </div>
      </div>

      {/* 색상 선택 */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-600 mb-1.5">테마 색상</h4>
        <div className="flex gap-2 justify-center">
          {colorOptions.map(({ name, color }) => (
            <button
              key={name}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-200 
                ${currentColor === color 
                  ? 'border-2 border-gray-800 shadow-lg' 
                  : 'border border-black/10'
                }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-600 mb-1.5">알림</h4>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={e => onUpdateSettings({ soundEnabled: e.target.checked })}
            className="w-3 h-3"
          />
          <label className="text-xs text-gray-800">사운드 알림</label>
        </div>
      </div>

      {/* 자동 시작 설정 */}
      <div className="mb-2">
        <h4 className="text-xs font-medium text-gray-600 mb-1.5">자동 시작</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-800">휴식 자동 시작</label>
            <ToggleSwitch
              checked={settings.autoStartBreak}
              onChange={(checked) => onUpdateSettings({ autoStartBreak: checked })}
              color={buttonColor}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-800">다음 작업 세션 자동 시작</label>
            <ToggleSwitch
              checked={settings.autoStartNext}
              onChange={(checked) => onUpdateSettings({ autoStartNext: checked })}
              color={buttonColor}
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};