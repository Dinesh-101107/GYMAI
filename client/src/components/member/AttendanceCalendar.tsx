import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { AttendanceLog } from '../../types/index.js';

interface AttendanceCalendarProps {
  logs: AttendanceLog[];
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a map of checked in days for this month
  const checkInDaysMap = new Map<number, AttendanceLog>();
  logs.forEach((log) => {
    const logDate = new Date(log.checkInTime);
    if (logDate.getFullYear() === year && logDate.getMonth() === month) {
      checkInDaysMap.set(logDate.getDate(), log);
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-gym-card rounded-xl border border-gym-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {monthNames[month]} {year}
          </h3>
          <p className="text-xs text-gym-muted">
            {checkInDaysMap.size} workout sessions completed this month
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-gym-plate text-gym-subtext hover:text-white border border-gym-border"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-gym-plate text-gym-subtext hover:text-white border border-gym-border"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-gym-muted">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading blanks */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`blank-${i}`} className="h-12 rounded-lg bg-gym-plate/20 opacity-30" />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const log = checkInDaysMap.get(day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={day}
              className={`h-12 rounded-lg p-1.5 border flex flex-col justify-between transition-all ${
                log
                  ? 'bg-gym-red/15 border-gym-red/60 text-white font-bold shadow-sm'
                  : 'bg-gym-plate/40 border-gym-border/40 text-gym-subtext'
              } ${isToday ? 'ring-1 ring-white/50' : ''}`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={isToday ? 'text-gym-red font-bold' : ''}>{day}</span>
                {log && <CheckCircle2 className="w-3 h-3 text-gym-red" />}
              </div>

              {log ? (
                <div className="text-[9px] font-mono text-zinc-300 truncate">
                  {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="h-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
