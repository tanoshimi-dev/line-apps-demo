import { useState, useEffect } from 'react';
import { getServices, getStaff } from '../services/api';
import { login } from '../services/liff';
import type { ServiceInfo, StaffInfo } from '../types';

export default function Guest() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [staff, setStaff] = useState<StaffInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getServices(), getStaff()])
      .then(([s, st]) => {
        setServices(s);
        setStaff(st);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="guest-page">
      <header className="guest-hero">
        <h1 className="guest-title">Salon Reservation</h1>
        <p className="guest-subtitle">LINEで簡単にサロンの予約ができます</p>
        <button className="btn btn-primary btn-large" onClick={login}>
          LINEでログイン
        </button>
      </header>

      <main className="guest-content">
        <section className="guest-section">
          <h2 className="guest-section-title">メニュー</h2>
          {loading ? (
            <div className="loading-spinner">読み込み中...</div>
          ) : (
            <div className="guest-service-list">
              {services.map((service) => (
                <div key={service.id} className="guest-service-card">
                  <div className="guest-service-info">
                    <h3>{service.name}</h3>
                    {service.description && <p>{service.description}</p>}
                  </div>
                  <div className="guest-service-meta">
                    <span className="guest-service-duration">{service.durationMinutes}分</span>
                    <span className="guest-service-price">¥{service.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {staff.length > 0 && (
          <section className="guest-section">
            <h2 className="guest-section-title">スタッフ</h2>
            <div className="guest-staff-list">
              {staff.map((s) => (
                <div key={s.id} className="guest-staff-card">
                  <div className="guest-staff-avatar">
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.name} />
                    ) : (
                      <div className="guest-avatar-placeholder">{s.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="guest-staff-info">
                    <h3>{s.name}</h3>
                    {s.specialty && <p>{s.specialty}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="guest-cta">
          <p>予約・メッセージにはLINEログインが必要です</p>
          <button className="btn btn-primary" onClick={login}>
            LINEでログイン
          </button>
        </section>
      </main>
    </div>
  );
}
