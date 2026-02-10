import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAdminStaffDetail,
  updateStaffProfile,
  updateStaffSchedule,
  addStaffException,
  removeStaffException,
  getAdminServices,
} from '../services/adminApi';
import type { AdminStaffDetail as StaffDetail, AdminService } from '../types';

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

export default function AdminStaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [allServices, setAllServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'schedule' | 'exceptions'>('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    serviceIds: [] as string[],
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState<
    { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]
  >([]);

  // Exception form
  const [exForm, setExForm] = useState({
    date: '',
    isAvailable: false,
    reason: '',
  });

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [staffData, services] = await Promise.all([
        getAdminStaffDetail(id),
        getAdminServices(),
      ]);
      setStaff(staffData);
      setAllServices(services);
      setProfileForm({
        name: staffData.name,
        specialty: staffData.specialty || '',
        bio: staffData.bio || '',
        serviceIds: staffData.services.map((s) => s.id),
      });

      // Initialize schedule form
      const schedules = [];
      for (let d = 0; d <= 6; d++) {
        const existing = staffData.schedules.find((s) => s.dayOfWeek === d);
        schedules.push({
          dayOfWeek: d,
          startTime: existing?.startTime || '10:00',
          endTime: existing?.endTime || '19:00',
          isAvailable: existing?.isAvailable ?? false,
        });
      }
      setScheduleForm(schedules);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleProfileSave = async () => {
    if (!id) return;
    try {
      await updateStaffProfile(id, {
        name: profileForm.name,
        specialty: profileForm.specialty || null,
        bio: profileForm.bio || null,
        service_ids: profileForm.serviceIds,
      });
      alert('プロフィールを更新しました');
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleScheduleSave = async () => {
    if (!id) return;
    try {
      await updateStaffSchedule(
        id,
        scheduleForm.map((s) => ({
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          end_time: s.endTime,
          is_available: s.isAvailable,
        }))
      );
      alert('スケジュールを更新しました');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addStaffException(id, {
        date: exForm.date,
        is_available: exForm.isAvailable,
        reason: exForm.reason || undefined,
      });
      setExForm({ date: '', isAvailable: false, reason: '' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleRemoveException = async (eid: string) => {
    if (!id) return;
    try {
      await removeStaffException(id, eid);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleService = (serviceId: string) => {
    setProfileForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!staff) return <div className="admin-error">Staff not found</div>;

  return (
    <div className="admin-page">
      <button className="admin-btn admin-btn-text" onClick={() => navigate('/admin/staff')}>
        ← スタッフ一覧に戻る
      </button>

      <h2 className="admin-page-title">{staff.name}</h2>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          プロフィール
        </button>
        <button className={`admin-tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>
          スケジュール
        </button>
        <button className={`admin-tab ${tab === 'exceptions' ? 'active' : ''}`} onClick={() => setTab('exceptions')}>
          休日設定
        </button>
      </div>

      {tab === 'profile' && (
        <div className="admin-form-card">
          <div className="admin-form-group">
            <label>名前</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="admin-input"
            />
          </div>
          <div className="admin-form-group">
            <label>専門</label>
            <input
              type="text"
              value={profileForm.specialty}
              onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
              className="admin-input"
            />
          </div>
          <div className="admin-form-group">
            <label>自己紹介</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="admin-textarea"
            />
          </div>
          <div className="admin-form-group">
            <label>対応メニュー</label>
            <div className="admin-checkbox-group">
              {allServices.map((svc) => (
                <label key={svc.id} className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={profileForm.serviceIds.includes(svc.id)}
                    onChange={() => toggleService(svc.id)}
                  />
                  {svc.name}
                </label>
              ))}
            </div>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleProfileSave}>
            保存
          </button>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="admin-form-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>曜日</th>
                <th>開始</th>
                <th>終了</th>
                <th>勤務</th>
              </tr>
            </thead>
            <tbody>
              {scheduleForm.map((s, i) => (
                <tr key={s.dayOfWeek}>
                  <td>{dayNames[s.dayOfWeek]}</td>
                  <td>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[i] = { ...updated[i], startTime: e.target.value };
                        setScheduleForm(updated);
                      }}
                      className="admin-input-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[i] = { ...updated[i], endTime: e.target.value };
                        setScheduleForm(updated);
                      }}
                      className="admin-input-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.isAvailable}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[i] = { ...updated[i], isAvailable: e.target.checked };
                        setScheduleForm(updated);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="admin-btn admin-btn-primary" onClick={handleScheduleSave}>
            スケジュールを保存
          </button>
        </div>
      )}

      {tab === 'exceptions' && (
        <div className="admin-form-card">
          <h3>休日・例外日を追加</h3>
          <form onSubmit={handleAddException}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>日付</label>
                <input
                  type="date"
                  value={exForm.date}
                  onChange={(e) => setExForm({ ...exForm, date: e.target.value })}
                  required
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exForm.isAvailable}
                    onChange={(e) => setExForm({ ...exForm, isAvailable: e.target.checked })}
                  />{' '}
                  出勤する
                </label>
              </div>
            </div>
            <div className="admin-form-group">
              <label>理由</label>
              <input
                type="text"
                value={exForm.reason}
                onChange={(e) => setExForm({ ...exForm, reason: e.target.value })}
                className="admin-input"
                placeholder="例: 有給休暇"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              追加
            </button>
          </form>

          <h3 style={{ marginTop: 24 }}>登録済みの例外日</h3>
          {staff.exceptions.length === 0 ? (
            <p className="admin-empty">例外日はありません</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>出勤</th>
                  <th>理由</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {staff.exceptions.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.date}</td>
                    <td>{ex.isAvailable ? 'はい' : 'いいえ'}</td>
                    <td>{ex.reason || '-'}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleRemoveException(ex.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
