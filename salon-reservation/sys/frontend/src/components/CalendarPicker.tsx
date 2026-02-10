import { useState, useMemo } from 'react';

interface CalendarPickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  minDate?: string;
}

export default function CalendarPicker({
  selectedDate,
  onSelect,
  minDate,
}: CalendarPickerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const min = minDate ? new Date(minDate) : today;
  min.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d));
    return result;
  }, [currentMonth]);

  const formatDate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  return (
    <div className="calendar-picker">
      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav">←</button>
        <span className="calendar-month">{monthLabel}</span>
        <button onClick={nextMonth} className="calendar-nav">→</button>
      </div>
      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <span key={day} className="calendar-weekday">{day}</span>
        ))}
      </div>
      <div className="calendar-days">
        {days.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} className="calendar-day empty" />;

          const dateStr = formatDate(day);
          const isPast = day < min;
          const isSelected = dateStr === selectedDate;
          const isToday = formatDate(today) === dateStr;

          return (
            <button
              key={dateStr}
              className={`calendar-day ${isSelected ? 'selected' : ''} ${
                isPast ? 'disabled' : ''
              } ${isToday ? 'today' : ''}`}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
