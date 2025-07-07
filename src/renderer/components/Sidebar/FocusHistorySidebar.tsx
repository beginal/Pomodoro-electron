import React from 'react';
import { FocusRecord, SessionGroup } from '../../hooks/useFocusHistory';

interface FocusHistorySidebarProps {
  isOpen: boolean;
  focusHistory: FocusRecord[];
  sessionGroups: SessionGroup[];
  totalFocusTime: number;
  sessionCount: number;
  buttonColor: string;
  onClose: () => void;
  onDeleteRecord: (id: number) => void;
  onClearAll: () => void;
}

export const FocusHistorySidebar: React.FC<FocusHistorySidebarProps> = ({
  isOpen,
  focusHistory,
  sessionGroups,
  totalFocusTime,
  sessionCount,
  buttonColor,
  onClose,
  onDeleteRecord,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/10 z-[998]"
        onClick={onClose}
      />

      {/* 사이드바 */}
      <div
        className="fixed right-0 top-7 w-80 bg-white/95 backdrop-blur-md rounded-l-3xl shadow-2xl p-8 font-system z-[999] animate-slideInRight flex flex-col"
        style={{ height: 'calc(550px - 28px)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-5">집중 기록</h2>

        {/* 오늘의 통계 */}
        <div className="bg-white/70 rounded-xl p-4 mb-5 border border-black/5">
          <h3 className="text-sm font-medium text-gray-600 mb-2.5">오늘의 집중 시간</h3>
          <div 
            className="text-2xl font-bold"
            style={{ color: buttonColor }}
          >
            {Math.floor(totalFocusTime / 60)}시간 {totalFocusTime % 60}분
          </div>
          <div className="text-xs text-gray-500 mt-1">
            완료된 세션: {sessionCount}개
          </div>
        </div>

        {/* 집중 기록 목록 */}
        <div className="flex-1 overflow-hidden">
          <h3 className="text-base font-semibold text-gray-800 mb-4">최근 활동</h3>
          {sessionGroups.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10">
              아직 완료된 세션이 없습니다.
              <br />
              첫 번째 집중 세션을 시작해보세요!
            </div>
          ) : (
            <div className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="flex flex-col gap-2 pb-4">
                {sessionGroups.map(group => (
                  <div
                    key={group.id}
                    className="bg-white/80 rounded-lg p-3 border border-black/5 text-sm"
                  >
                    <div className="mb-2">
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                        <span className="font-semibold">세션 #{group.id}</span>
                        <span className="text-gray-500">
                          {group.startTime} - {group.endTime}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        작업 {group.sessionCount}회 • 총 {group.totalWorkTime + group.totalBreakTime}분
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {group.records.map((record, index) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: record.type === 'work' ? buttonColor + '20' : '#4CAF5020',
                            color: record.type === 'work' ? buttonColor : '#4CAF50'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{record.startTime}</span>
                            <span>{record.type === 'work' ? '작업' : '휴식'}</span>
                            <span>{record.duration}분</span>
                          </div>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="w-3 h-3 flex items-center justify-center rounded hover:bg-red-100"
                            title="기록 삭제"
                          >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 모든 기록 삭제 버튼 */}
          {sessionGroups.length > 0 && (
            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  if (confirm('모든 집중 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    onClearAll();
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs cursor-pointer transition-all duration-200 hover:bg-red-400"
              >
                모든 기록 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};