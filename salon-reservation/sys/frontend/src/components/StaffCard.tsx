import type { StaffInfo } from '../types';

interface StaffCardProps {
  staff: StaffInfo;
  onSelect?: (staff: StaffInfo) => void;
  selected?: boolean;
}

export default function StaffCard({ staff, onSelect, selected }: StaffCardProps) {
  return (
    <div
      className={`staff-card ${selected ? 'selected' : ''} ${onSelect ? 'clickable' : ''}`}
      onClick={() => onSelect?.(staff)}
    >
      <div className="staff-avatar">
        {staff.avatarUrl ? (
          <img src={staff.avatarUrl} alt={staff.name} />
        ) : (
          <div className="staff-avatar-placeholder">
            {staff.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="staff-info">
        <h3 className="staff-name">{staff.name}</h3>
        {staff.specialty && (
          <p className="staff-specialty">{staff.specialty}</p>
        )}
      </div>
    </div>
  );
}
