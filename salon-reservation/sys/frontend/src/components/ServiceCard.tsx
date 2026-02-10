import type { ServiceInfo } from '../types';

interface ServiceCardProps {
  service: ServiceInfo;
  onSelect?: (service: ServiceInfo) => void;
  selected?: boolean;
}

export default function ServiceCard({ service, onSelect, selected }: ServiceCardProps) {
  return (
    <div
      className={`service-card ${selected ? 'selected' : ''} ${onSelect ? 'clickable' : ''}`}
      onClick={() => onSelect?.(service)}
    >
      <div className="service-info">
        <h3 className="service-name">{service.name}</h3>
        {service.description && (
          <p className="service-description">{service.description}</p>
        )}
        <div className="service-meta">
          <span className="service-duration">{service.durationMinutes}分</span>
          <span className="service-price">¥{service.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
