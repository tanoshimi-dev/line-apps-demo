import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import type { ServiceInfo } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ServiceCard from '../components/ServiceCard';

export default function Services() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Header title="メニュー" />
      <main className="main-content">
        {loading ? (
          <div className="loading-spinner">読み込み中...</div>
        ) : (
          <div className="card-list">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={() =>
                  navigate('/reserve', { state: { serviceId: service.id } })
                }
              />
            ))}
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
}
