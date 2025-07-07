import { useState, useEffect, useCallback } from 'react';

export interface FocusRecord {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'work' | 'break';
  sessionGroup?: number;
}

export interface SessionGroup {
  id: number;
  records: FocusRecord[];
  totalWorkTime: number;
  totalBreakTime: number;
  sessionCount: number;
  startTime: string;
  endTime: string;
}

export interface UseFocusHistoryReturn {
  focusHistory: FocusRecord[];
  sessionGroups: SessionGroup[];
  totalFocusTime: number;
  addFocusRecord: (type: 'work' | 'break', duration: number, sessionStartTime?: Date | null) => void;
  deleteFocusRecord: (id: number) => void;
  clearAllRecords: () => void;
}

export const useFocusHistory = (): UseFocusHistoryReturn => {
  const [focusHistory, setFocusHistory] = useState<FocusRecord[]>(() => {
    const savedHistory = localStorage.getItem('pomodoroFocusHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [totalFocusTime, setTotalFocusTime] = useState(() => {
    const savedTotalTime = localStorage.getItem('pomodoroTotalFocusTime');
    return savedTotalTime ? parseInt(savedTotalTime) : 0;
  });

  // 기존 레코드들의 sessionGroup 속성 초기화
  useEffect(() => {
    const needsGroupAssignment = focusHistory.some(record => !record.sessionGroup);
    if (needsGroupAssignment) {
      let currentGroupId = 1;
      const updatedHistory = focusHistory.map((record, index) => {
        if (record.sessionGroup) return record; // 이미 할당된 경우 그대로 유지
        
        // 새로운 그룹 시작 조건
        if (index === 0 || 
            (record.type === 'work' && focusHistory[index - 1].type === 'work')) {
          currentGroupId++;
        }
        
        return { ...record, sessionGroup: currentGroupId };
      });
      setFocusHistory(updatedHistory);
    }
  }, []);

  // 세션 그룹 생성 로직 - sessionGroup 속성 기반
  const sessionGroups: SessionGroup[] = focusHistory.reduce((groups: SessionGroup[], record) => {
    const groupId = record.sessionGroup || 1;
    let existingGroup = groups.find(group => group.id === groupId);
    
    if (!existingGroup) {
      // 새로운 세션 그룹 생성
      existingGroup = {
        id: groupId,
        records: [],
        totalWorkTime: 0,
        totalBreakTime: 0,
        sessionCount: 0,
        startTime: record.startTime,
        endTime: record.endTime
      };
      groups.push(existingGroup);
    }
    
    // 레코드를 그룹에 추가
    existingGroup.records.push(record);
    
    // 시간 업데이트 (최신 레코드가 첫 번째이므로 startTime 업데이트)
    if (record.startTime < existingGroup.startTime || existingGroup.records.length === 1) {
      existingGroup.startTime = record.startTime;
    }
    if (record.endTime > existingGroup.endTime || existingGroup.records.length === 1) {
      existingGroup.endTime = record.endTime;
    }
    
    // 통계 업데이트
    if (record.type === 'work') {
      existingGroup.totalWorkTime += record.duration;
      existingGroup.sessionCount += 1;
    } else {
      existingGroup.totalBreakTime += record.duration;
    }
    
    return groups;
  }, []).sort((a, b) => b.id - a.id); // 최신 순으로 정렬

  // 집중 기록 저장
  useEffect(() => {
    localStorage.setItem('pomodoroFocusHistory', JSON.stringify(focusHistory));
  }, [focusHistory]);

  // 총 집중 시간 저장
  useEffect(() => {
    localStorage.setItem('pomodoroTotalFocusTime', totalFocusTime.toString());
  }, [totalFocusTime]);

  const addFocusRecord = useCallback((
    type: 'work' | 'break', 
    duration: number, 
    sessionStartTime?: Date | null
  ) => {
    const now = new Date();
    const startTime = sessionStartTime || new Date(now.getTime() - duration * 1000);

    // 세션 그룹 ID 결정
    let sessionGroupId = 1;
    if (focusHistory.length > 0) {
      const lastRecord = focusHistory[0]; // 배열이 최신 순으로 정렬되어 있음
      if (type === 'work') {
        // 작업 세션은 새로운 그룹 시작
        sessionGroupId = (lastRecord.sessionGroup || 1) + 1;
      } else {
        // 휴식 세션은 마지막 작업 세션과 같은 그룹
        sessionGroupId = lastRecord.sessionGroup || 1;
      }
    }

    const record: FocusRecord = {
      id: Date.now(),
      date: now.toLocaleDateString('ko-KR'),
      startTime: startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      endTime: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      duration: Math.floor(duration / 60),
      type,
      sessionGroup: sessionGroupId,
    };

    setFocusHistory(prev => [record, ...prev]);

    if (type === 'work') {
      setTotalFocusTime(prev => prev + Math.floor(duration / 60));
    }
  }, []);

  const deleteFocusRecord = useCallback((id: number) => {
    setFocusHistory(prev => {
      const recordToDelete = prev.find(record => record.id === id);
      if (recordToDelete && recordToDelete.type === 'work') {
        setTotalFocusTime(prevTime => Math.max(0, prevTime - recordToDelete.duration));
      }
      return prev.filter(record => record.id !== id);
    });
  }, []);

  const clearAllRecords = useCallback(() => {
    setFocusHistory([]);
    setTotalFocusTime(0);
  }, []);

  return {
    focusHistory,
    sessionGroups,
    totalFocusTime,
    addFocusRecord,
    deleteFocusRecord,
    clearAllRecords,
  };
};