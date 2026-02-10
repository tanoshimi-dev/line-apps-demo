import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getServices,
  getStaff,
  getStaffAvailability,
  createReservation,
} from '../services/api';
import type { ServiceInfo, StaffInfo, TimeSlot } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ServiceCard from '../components/ServiceCard';
import StaffCard from '../components/StaffCard';
import CalendarPicker from '../components/CalendarPicker';
import TimeSlotPicker from '../components/TimeSlotPicker';

type Step = 'service' | 'staff' | 'datetime' | 'confirm';

export default function Reserve() {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedServiceId = (location.state as { serviceId?: string })?.serviceId;

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services
  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data);
        if (preSelectedServiceId) {
          const found = data.find((s) => s.id === preSelectedServiceId);
          if (found) {
            setSelectedService(found);
            setStep('staff');
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [preSelectedServiceId]);

  // Load staff when service selected
  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    getStaff(selectedService.id)
      .then(setStaffList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedService]);

  // Load availability when date selected
  useEffect(() => {
    if (!selectedStaff || !selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getStaffAvailability(selectedStaff.id, selectedDate, selectedService.id)
      .then((data) => setSlots(data.slots))
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
  }, [selectedStaff, selectedDate, selectedService]);

  const handleSelectService = (service: ServiceInfo) => {
    setSelectedService(service);
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('staff');
  };

  const handleSelectStaff = (staff: StaffInfo) => {
    setSelectedStaff(staff);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('datetime');
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      await createReservation({
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        notes: notes || undefined,
      });
      navigate('/reservations', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '予約に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'confirm') setStep('datetime');
    else if (step === 'datetime') setStep('staff');
    else if (step === 'staff') setStep('service');
  };

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="page">
      <Header title="予約" />
      <main className="main-content">
        {/* Progress indicator */}
        <div className="wizard-progress">
          {(['service', 'staff', 'datetime', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`wizard-step ${step === s ? 'active' : ''} ${
                ['service', 'staff', 'datetime', 'confirm'].indexOf(step) > i
                  ? 'completed'
                  : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {step !== 'service' && (
          <button className="btn btn-text" onClick={goBack}>
            ← 戻る
          </button>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Select Service */}
        {step === 'service' && (
          <section className="section">
            <h3 className="section-title">メニューを選択</h3>
            {loading ? (
              <div className="loading-spinner">読み込み中...</div>
            ) : (
              <div className="card-list">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={selectedService?.id === service.id}
                    onSelect={handleSelectService}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 2: Select Staff */}
        {step === 'staff' && (
          <section className="section">
            <h3 className="section-title">スタッフを選択</h3>
            <p className="section-subtitle">
              選択中: {selectedService?.name}
            </p>
            {loading ? (
              <div className="loading-spinner">読み込み中...</div>
            ) : staffList.length === 0 ? (
              <p className="empty-text">対応可能なスタッフがいません</p>
            ) : (
              <div className="card-list">
                {staffList.map((staff) => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    selected={selectedStaff?.id === staff.id}
                    onSelect={handleSelectStaff}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 'datetime' && (
          <section className="section">
            <h3 className="section-title">日時を選択</h3>
            <p className="section-subtitle">
              {selectedService?.name} / {selectedStaff?.name}
            </p>

            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              minDate={minDate}
            />

            {selectedDate && (
              <>
                <h4 className="subsection-title">空き時間</h4>
                <TimeSlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={(slot) => {
                    setSelectedSlot(slot);
                    setStep('confirm');
                  }}
                  loading={slotsLoading}
                />
              </>
            )}
          </section>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && selectedService && selectedStaff && selectedSlot && (
          <section className="section">
            <h3 className="section-title">予約内容の確認</h3>

            <div className="confirm-card">
              <div className="confirm-row">
                <span className="confirm-label">メニュー</span>
                <span className="confirm-value">{selectedService.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">スタッフ</span>
                <span className="confirm-value">{selectedStaff.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">日付</span>
                <span className="confirm-value">{selectedDate}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">時間</span>
                <span className="confirm-value">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">所要時間</span>
                <span className="confirm-value">
                  {selectedService.durationMinutes}分
                </span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">料金</span>
                <span className="confirm-value confirm-price">
                  ¥{selectedService.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">備考（任意）</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ご要望やご質問があればご記入ください"
                rows={3}
              />
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '予約中...' : '予約を確定する'}
            </button>
          </section>
        )}
      </main>
      <Navigation />
    </div>
  );
}
