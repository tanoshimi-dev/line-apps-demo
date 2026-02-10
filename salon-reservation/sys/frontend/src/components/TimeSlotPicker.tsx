import type { TimeSlot } from '../types';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: TimeSlotPickerProps) {
  if (loading) {
    return <div className="loading-spinner">読み込み中...</div>;
  }

  if (slots.length === 0) {
    return (
      <div className="empty-state">
        <p>空き時間がありません</p>
      </div>
    );
  }

  return (
    <div className="time-slot-grid">
      {slots.map((slot) => (
        <button
          key={`${slot.startTime}-${slot.endTime}`}
          className={`time-slot ${
            selectedSlot?.startTime === slot.startTime ? 'selected' : ''
          }`}
          onClick={() => onSelect(slot)}
        >
          {slot.startTime}
        </button>
      ))}
    </div>
  );
}
