import React, { useState, useEffect } from 'react';

// --- Types ---
interface BusData {
  route: string;
  lat: number;
  lng: number;
  nextStop: string;
  eta: number;
  passengers: string;
  updatedAt: string;
  selectedStop?: string;
  destination?: string;
  waitingPassengers?: number;
  rideStatus?: 'idle' | 'waiting' | 'on_board';
  driverAlert?: string;
  currentPassengersCount?: number;
  shiftActive?: boolean;
}

interface FeedbackItem {
  id: number;
  message: string;
  category: string;
  time: string;
}

interface LostItem {
  id: number;
  itemName: string;
  busRoute: string;
  foundLocation: string;
  status: 'กำลังตามหาเจ้าของ' | 'เก็บรักษาอยู่ที่ศูนย์' | 'ส่งคืนเจ้าของแล้ว';
  date: string;
}

interface RouteSchedule {
  id: number;
  routeName: string;
  times: string;
  status: string;
}

interface Announcement {
  id: number;
  message: string;
  time: string;
}

// --- Login Screen ---
function LoginScreen({ onLogin, darkMode }: { onLogin: (role: 'student' | 'driver' | 'staff') => void; darkMode: boolean }) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'driver' | 'staff'>('student');
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#1e293b';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ background: cardBg, color: textColor, padding: '40px', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(to right, #3b82f6, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniRide 🚐</h1>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>ระบบจัดการรถรับส่งอัจฉริยะภายในมหาวิทยาลัย</p>

        <label style={{ display: 'block', textAlign: 'left', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>เลือกบทบาทผู้ใช้งาน:</label>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#334155' : '#f8fafc', color: textColor, fontSize: '15px', marginBottom: '24px' }}>
          <option value="student">👨‍‍🎓 นักศึกษา (Student)</option>
          <option value="driver">🚌 พนักงานขับรถ (Driver)</option>
          <option value="staff">📊 เจ้าหน้าที่ / แอดมิน (Staff)</option>
        </select>

        <button onClick={() => onLogin(selectedRole)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px', width: '100%', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

// --- 1. หน้าจอฝั่งนักศึกษา (StudentView) ---
function StudentView({ darkMode }: { darkMode: boolean }) {
  const [busData, setBusData] = useState<BusData>(() => {
    const saved = localStorage.getItem('uniride_current_bus');
    return saved ? JSON.parse(saved) : {
      route: 'สาย 1 (หอพักใน - อาคารเรียนรวม)',
      lat: 18.7883,
      lng: 98.9853,
      nextStop: 'ป้ายหน้าคณะ IT',
      eta: 3,
      passengers: 'ปานกลาง (25 คน)',
      updatedAt: 'กำลังรอสัญญาณ...',
      selectedStop: 'ป้ายหอพักชาย',
      destination: 'อาคารเรียนรวม 5 ชั้น',
      waitingPassengers: 1,
      rideStatus: 'idle',
      driverAlert: '',
      currentPassengersCount: 18,
      shiftActive: true
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'schedule' | 'feedback' | 'lostfound' | 'rating'>('dashboard');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [category, setCategory] = useState('ลืมของ');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [proximityAlert, setProximityAlert] = useState<string | null>(null);

  const tabBtnStyle: React.CSSProperties = { border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: '0.2s', whiteSpace: 'nowrap' };

  const announcements: Announcement[] = (() => {
    const saved = localStorage.getItem('uniride_announcements');
    return saved ? JSON.parse(saved) : [{ id: 1, message: 'ยินดีต้อนรับสู่ระบบ UniRide เปิดให้บริการตามปกติ', time: '08:00 น.' }];
  })();

  const lostItems: LostItem[] = (() => {
    const saved = localStorage.getItem('uniride_lost_items');
    return saved ? JSON.parse(saved) : [
      { id: 1, itemName: 'ร่มสีฟ้าพับได้', busRoute: 'สาย 1', foundLocation: 'เบาะหลังแถวที่ 3', status: 'เก็บรักษาอยู่ที่ศูนย์', date: '07 ต.ค. 2026' }
    ];
  })();

  const routeSchedules: RouteSchedule[] = (() => {
    const saved = localStorage.getItem('uniride_routes');
    return saved ? JSON.parse(saved) : [
      { id: 1, routeName: 'สาย 1 (หอพักใน - อาคารเรียนรวม)', times: '08:00, 09:00, 10:00', status: '🟢 เปิดให้บริการ' }
    ];
  })();

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('uniride_current_bus');
      if (saved) {
        const parsed: BusData = JSON.parse(saved);
        setBusData(parsed);

        if (parsed.shiftActive && parsed.rideStatus === 'waiting' && parsed.eta <= 2) {
          setProximityAlert(`🚨 รถของคุณ (${parsed.route}) กำลังจะถึง ${parsed.selectedStop} ในอีก ${parsed.eta} นาที! กรุณาเตรียมตัวที่ป้าย`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateBusData = (updates: Partial<BusData>) => {
    const updated = { ...busData, ...updates };
    setBusData(updated);
    localStorage.setItem('uniride_current_bus', JSON.stringify(updated));
  };

  const handleCallBus = () => {
    if (!busData.shiftActive) {
      alert('⚠️ รถคันนี้กำลังพักกะ (จบกะ) อยู่ ไม่สามารถส่งคำขอเรียกรถได้');
      return;
    }
    const isWaiting = busData.rideStatus === 'waiting';
    const newStatus = isWaiting ? 'idle' : 'waiting';
    const currentWait = busData.waitingPassengers || 0;
    const newWaitCount = isWaiting ? Math.max(0, currentWait - 1) : currentWait + 1;

    if (!isWaiting) {
      setProximityAlert(null);
    }

    handleUpdateBusData({
      rideStatus: newStatus,
      waitingPassengers: newWaitCount,
      eta: 2
    });
  };

  const handleRefreshMap = () => {
    const saved = localStorage.getItem('uniride_current_bus');
    if (saved) {
      setBusData(JSON.parse(saved));
      alert('🔄 อัปเดตตำแหน่งและสถานะรถล่าสุดสำเร็จ!');
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    const existing = localStorage.getItem('uniride_feedbacks');
    const list: FeedbackItem[] = existing ? JSON.parse(existing) : [];
    const newItem: FeedbackItem = { id: Date.now(), message: feedbackMsg, category, time: new Date().toLocaleTimeString() };
    const updatedList = [newItem, ...list];
    localStorage.setItem('uniride_feedbacks', JSON.stringify(updatedList));
    setFeedbackMsg('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleSendRating = () => {
    localStorage.setItem('uniride_last_rating', String(rating));
    setRatedSuccess(true);
    setTimeout(() => setRatedSuccess(false), 3000);
  };

  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#1e293b';

  return (
    <div style={{ background: cardBg, color: textColor, padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', transition: '0.3s' }}>
      
      {proximityAlert && (
        <div style={{ background: '#fef08a', borderLeft: '5px solid #eab308', padding: '16px', borderRadius: '10px', marginBottom: '20px', color: '#713f12', fontSize: '14px', fontWeight: 'bold' }}>
          🔔 <b>แจ้งเตือนรถใกล้ถึงป้าย:</b> {proximityAlert}
          <button onClick={() => setProximityAlert(null)} style={{ background: 'transparent', border: 'none', float: 'right', cursor: 'pointer', fontWeight: 'bold', color: '#713f12' }}>✕ ปิด</button>
        </div>
      )}

      {announcements.length > 0 && (
        <div style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: '#0369a1', fontSize: '14px', fontWeight: '500' }}>
          📢 <b>ประกาศด่วนจากแอดมิน:</b> {announcements[0].message} <span style={{ fontSize: '12px', opacity: 0.8, float: 'right' }}>{announcements[0].time}</span>
        </div>
      )}

      {busData.driverAlert && (
        <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
          🚨 <b>แจ้งเตือนสำคัญจากคนขับรถ:</b> {busData.driverAlert}
        </div>
      )}

      {/* แถบสถานะกะการทำงานปัจจุบัน (เชื่อมโยงกับคนขับ) */}
      <div style={{ background: busData.shiftActive ? '#dcfce7' : '#fee2e2', borderLeft: `5px solid ${busData.shiftActive ? '#22c55e' : '#ef4444'}`, padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: busData.shiftActive ? '#166534' : '#991b1b', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🚍 สายรถปัจจุบัน: {busData.route}</span>
        <span style={{ padding: '6px 12px', borderRadius: '20px', background: busData.shiftActive ? '#22c55e' : '#ef4444', color: '#fff', fontSize: '12px' }}>
          {busData.shiftActive ? '🟢 กำลังให้บริการ (เริ่มกะ)' : '🔴 พักกะ / งดให้บริการ'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', borderBottom: `2px solid ${darkMode ? '#334155' : '#f1f5f9'}`, paddingBottom: '12px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ ...tabBtnStyle, background: activeTab === 'dashboard' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'dashboard' ? '#fff' : textColor }}>🚀 แผงด่วน</button>
        <button onClick={() => setActiveTab('map')} style={{ ...tabBtnStyle, background: activeTab === 'map' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'map' ? '#fff' : textColor }}>🗺️ ติดตามรถ</button>
        <button onClick={() => setActiveTab('schedule')} style={{ ...tabBtnStyle, background: activeTab === 'schedule' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'schedule' ? '#fff' : textColor }}>🕒 ตารางเดินรถ</button>
        <button onClick={() => setActiveTab('feedback')} style={{ ...tabBtnStyle, background: activeTab === 'feedback' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'feedback' ? '#fff' : textColor }}>💬 แจ้งปัญหา</button>
        <button onClick={() => setActiveTab('lostfound')} style={{ ...tabBtnStyle, background: activeTab === 'lostfound' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'lostfound' ? '#fff' : textColor }}>🔍 ของหาย</button>
        <button onClick={() => setActiveTab('rating')} style={{ ...tabBtnStyle, background: activeTab === 'rating' ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), color: activeTab === 'rating' ? '#fff' : textColor }}>⭐ ประเมิน</button>
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: '6px' }}>👋 แผงด่วน (Student Dashboard)</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>เลือกป้ายจุดรอและส่งสัญญาณเรียกรถได้อย่างรวดเร็ว</p>

          <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '14px' }}>📍 ระบุจุดขึ้นรถของคุณ</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>เลือกป้ายรถเมล์:</label>
              <select value={busData.selectedStop} onChange={(e) => handleUpdateBusData({ selectedStop: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor }}>
                <option>ป้ายหอพักชาย</option>
                <option>ป้ายคณะ IT</option>
                <option>ป้ายโรงอาหารกลาง</option>
                <option>ป้ายอาคารเรียนรวม</option>
              </select>
            </div>
            <button onClick={handleCallBus} style={{ background: !busData.shiftActive ? '#94a3b8' : (busData.rideStatus === 'waiting' ? '#ef4444' : '#22c55e'), color: '#fff', border: 'none', padding: '14px', width: '100%', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: busData.shiftActive ? 'pointer' : 'not-allowed' }}>
              {!busData.shiftActive ? '⛔ รถพักกะอยู่ (ไม่สามารถเรียกรถได้)' : (busData.rideStatus === 'waiting' ? '❌ ยกเลิกคำขอเรียกรถ' : '🙋‍♂️ ส่งคำขอเรียกรถ (แจ้งคนขับว่าฉันรออยู่)')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>🗺️ ติดตามตำแหน่งรถ Real-time</h3>
            <button onClick={handleRefreshMap} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>🔄 รีเฟรชตำแหน่งรถ</button>
          </div>
          <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${busData.shiftActive ? '#3b82f6' : '#ef4444'}`, marginBottom: '20px' }}>
            <p style={{ margin: '0 0 10px 0' }}><b>สายรถ:</b> <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{busData.route}</span></p>
            <p style={{ margin: '0 0 10px 0' }}><b>จุดจอดถัดไป:</b> <span style={{ color: '#0ea5e9', fontWeight: '600' }}>{busData.shiftActive ? busData.nextStop : 'รถจอดพักประจำศูนย์'}</span></p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#1e293b' : '#e0f2fe', padding: '12px 16px', borderRadius: '8px', margin: '12px 0', fontWeight: 'bold' }}>
              <span>⏱ เวลามาถึงโดยประมาณ (ETA):</span>
              <span style={{ color: busData.shiftActive ? '#ef4444' : '#64748b', fontSize: '16px' }}>
                {busData.shiftActive ? `~ ${busData.eta} นาที` : '🛑 พักกะ / งดให้บริการ'}
              </span>
            </div>
            <p style={{ margin: '0 0 8px 0' }}><b>ความหนาแน่น:</b> {busData.shiftActive ? busData.passengers : 'ไม่มีผู้โดยสาร'}</p>
            <p style={{ margin: 0 }}><b>ผู้โดยสารบนรถ:</b> <span style={{ color: '#38bdf8', fontWeight: '600' }}>{busData.shiftActive ? (busData.currentPassengersCount || 0) : 0} คน</span></p>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>อัปเดตล่าสุด: {busData.updatedAt || 'ยังไม่มีการส่งพิกัด'}</p>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>🕒 ตารางเดินรถประจำวัน (ซิงค์สถานะกับคนขับเรียลไทม์)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#3b82f6', color: '#fff' }}>
                <th style={{ padding: '12px', fontSize: '14px' }}>สายรถ</th>
                <th style={{ padding: '12px', fontSize: '14px' }}>เวลาออกรอบ</th>
                <th style={{ padding: '12px', fontSize: '14px' }}>สถานะปัจจุบัน</th>
              </tr>
            </thead>
            <tbody>
              {routeSchedules.map(sch => {
                const isActive = sch.routeName === busData.route && busData.shiftActive;
                return (
                  <tr key={sch.id} style={{ borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>{sch.routeName}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{sch.times}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: isActive ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                      {isActive ? '🟢 กำลังให้บริการ' : '🔴 พักกะ / ปิดรอบ'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>💬 แจ้งปัญหาหรือลืมของไว้บนรถ</h3>
          {sentSuccess && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: '500' }}>✅ ส่งข้อมูลเรียบร้อยแล้ว แอดมินได้รับเรื่องแล้ว</div>}
          <form onSubmit={handleSendFeedback}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>ประเภทปัญหา:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#334155' : '#fff', color: textColor, marginBottom: '16px' }}>
              <option value="ลืมของ">ลืมของบนรถ</option>
              <option value="พฤติกรรมคนขับ">พฤติกรรมคนขับ</option>
              <option value="รถเสีย/ล่าช้า">รถเสีย / ล่าช้าผิดปกติ</option>
            </select>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>รายละเอียด:</label>
            <textarea rows={3} value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} placeholder="ระบุรายละเอียด..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#334155' : '#fff', color: textColor, marginBottom: '20px', boxSizing: 'border-box' }} />
            <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>ส่งข้อมูลไปยังแอดมิน</button>
          </form>
        </div>
      )}

      {activeTab === 'lostfound' && (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '6px' }}>🔍 กระดานประกาศของหายและติดตามสิ่งของ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {lostItems.map((item) => (
              <div key={item.id} style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>🎒 {item.itemName}</h4>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', background: '#dcfce7', color: '#15803d' }}>{item.status}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0' }}>🚍 รถ: {item.busRoute} | จุดที่พบ: {item.foundLocation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rating' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h3>⭐ ประเมินความพึงพอใจการใช้บริการ</h3>
          {ratedSuccess && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: '500' }}>🎉 ขอบคุณสำหรับการประเมิน คะแนนถูกส่งให้แอดมินแล้ว!</div>}
          <div style={{ fontSize: '36px', margin: '20px 0', cursor: 'pointer' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} onClick={() => setRating(star)} style={{ color: star <= rating ? '#fbbf24' : '#cbd5e1', margin: '0 5px' }}>★</span>
            ))}
          </div>
          <button onClick={handleSendRating} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>ส่งคะแนนประเมิน</button>
        </div>
      )}
    </div>
  );
}

// --- 2. หน้าจอฝั่งคนขับ (DriverView) ---
function DriverView({ darkMode }: { darkMode: boolean }) {
  const [busData, setBusData] = useState<BusData>(() => {
    const saved = localStorage.getItem('uniride_current_bus');
    return saved ? JSON.parse(saved) : { 
      route: 'สาย 1 (หอพักใน - อาคารเรียนรวม)', 
      lat: 18.7883, 
      lng: 98.9853, 
      nextStop: 'ป้ายคณะ IT', 
      eta: 3, 
      passengers: 'ปานกลาง (25 คน)', 
      updatedAt: '', 
      selectedStop: 'ป้ายหอพักชาย', 
      destination: 'อาคารเรียนรวม', 
      waitingPassengers: 1, 
      rideStatus: 'waiting', 
      driverAlert: '', 
      currentPassengersCount: 18,
      shiftActive: true
    };
  });

  const [newItemName, setNewItemName] = useState('');
  const [foundLocation, setFoundLocation] = useState('เบาะหลังรถ');
  const [statusMsg, setStatusMsg] = useState('พร้อมปฏิบัติงาน');
  const [alertText, setAlertText] = useState('');

  const routeSchedules: RouteSchedule[] = (() => {
    const saved = localStorage.getItem('uniride_routes');
    return saved ? JSON.parse(saved) : [
      { id: 1, routeName: 'สาย 1 (หอพักใน - อาคารเรียนรวม)', times: '08:00, 09:00, 10:00', status: '🟢 เปิดให้บริการ' }
    ];
  })();

  const handleUpdateBusData = (updates: Partial<BusData>) => {
    const updated = { ...busData, ...updates };
    setBusData(updated);
    localStorage.setItem('uniride_current_bus', JSON.stringify(updated));
  };

  const handleToggleShift = () => {
    const nextState = !busData.shiftActive;
    handleUpdateBusData({ shiftActive: nextState });
    setStatusMsg(nextState ? 'เริ่มกะการทำงานแล้ว' : 'จบกะการทำงาน (พักรถ)');
  };

  const handleGpsUpdate = () => {
    if (!busData.shiftActive) {
      alert('⚠️ กรุณากด "เริ่มกะการทำงาน" ก่อนส่งพิกัด GPS');
      return;
    }
    handleUpdateBusData({
      lat: 18.7883 + (Math.random() * 0.002),
      lng: 98.9853 + (Math.random() * 0.002),
      updatedAt: new Date().toLocaleTimeString(),
      eta: Math.max(1, busData.eta - 1)
    });
    setStatusMsg('ส่งพิกัด GPS สำเร็จ!');
  };

  const handlePassengerCountChange = (delta: number) => {
    const current = busData.currentPassengersCount || 0;
    const newCount = Math.max(0, current + delta);
    let density = 'ว่าง (< 10 คน)';
    if (newCount >= 10 && newCount <= 25) density = 'ปานกลาง (25 คน)';
    if (newCount > 25) density = 'หนาแน่น (เต็มคัน)';

    handleUpdateBusData({
      currentPassengersCount: newCount,
      passengers: density
    });
  };

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertText.trim()) return;
    handleUpdateBusData({ driverAlert: alertText });
    setAlertText('');
    alert('📢 ส่งข้อความแจ้งเตือนถึงหน้านักศึกษาสำเร็จ!');
  };

  const handleReportLostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const existing = localStorage.getItem('uniride_lost_items');
    const list: LostItem[] = existing ? JSON.parse(existing) : [];
    const newItem: LostItem = {
      id: Date.now(),
      itemName: newItemName,
      busRoute: busData.route,
      foundLocation,
      status: 'เก็บรักษาอยู่ที่ศูนย์',
      date: new Date().toLocaleDateString()
    };
    localStorage.setItem('uniride_lost_items', JSON.stringify([newItem, ...list]));
    setNewItemName('');
    alert('บันทึกแจ้งของหายเข้าระบบสำเร็จ!');
  };

  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#1e293b';

  return (
    <div style={{ background: cardBg, color: textColor, padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>🚗 แผงควบคุมพนักงานขับรถ</h2>
        <button onClick={handleToggleShift} style={{ background: busData.shiftActive ? '#ef4444' : '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
          {busData.shiftActive ? '🛑 จบกะการทำงาน' : '🟢 เริ่มกะการทำงาน'}
        </button>
      </div>
      <p style={{ color: busData.shiftActive ? '#22c55e' : '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>สถานะ: {statusMsg} ({busData.shiftActive ? '🟢 กำลังให้บริการ' : '🔴 ปิดกะ'})</p>

      {/* สัญญาณเรียกรถจากนักศึกษา */}
      <div style={{ background: busData.rideStatus === 'waiting' ? '#fef08a' : (darkMode ? '#334155' : '#f8fafc'), color: busData.rideStatus === 'waiting' ? '#854d0e' : '#64748b', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        🚨 <b>สัญญาณเรียกรถจากนักศึกษา:</b> 
        {busData.rideStatus === 'waiting' ? (
          <span> มีนักศึกษารออยู่ที่ <u>{busData.selectedStop}</u> จำนวน {busData.waitingPassengers || 1} คน</span>
        ) : (
          <span> ไม่มีคำขอเรียกรถเร่งด่วนในขณะนี้</span>
        )}
      </div>

      {/* จัดการเส้นทางและ GPS */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '12px' }}>⚙ จัดการสายรถและส่งพิกัด</h3>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>เลือกสายที่ขับ:</label>
          <select value={busData.route} onChange={(e) => handleUpdateBusData({ route: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor }}>
            {routeSchedules.map(r => (
              <option key={r.id} value={r.routeName}>{r.routeName}</option>
            ))}
          </select>
        </div>
        <button onClick={handleGpsUpdate} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginBottom: '10px' }}>
          📍 ส่งพิกัด GPS อัปเดตตำแหน่งรถทันที
        </button>
        <button onClick={() => {
          handleUpdateBusData({ rideStatus: 'idle', waitingPassengers: 0 });
          alert('ยืนยันการรับผู้โดยสารเรียบร้อย!');
        }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', width: '100%', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
          ✅ เคลียร์ยอดผู้โดยสารรอที่ป้ายนี้
        </button>
      </div>

      {/* ระบบนับผู้โดยสาร */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '12px' }}>👥 ระบบนับจำนวนผู้โดยสารบนรถ</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#1e293b' : '#fff', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, marginBottom: '12px' }}>
          <span>จำนวนผู้โดยสารขณะนี้:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{busData.currentPassengersCount || 0} คน</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handlePassengerCountChange(1)} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', flex: 1, cursor: 'pointer' }}>➕ ขึ้น (+1)</button>
          <button onClick={() => handlePassengerCountChange(-1)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', flex: 1, cursor: 'pointer' }}>➖ ลง (-1)</button>
        </div>
      </div>

      {/* ส่งแจ้งเตือนด่วนถึงนักศึกษา */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '12px' }}>🚨 ส่งข้อความแจ้งเตือนถึงนักศึกษา</h3>
        <form onSubmit={handleSendAlert}>
          <input type="text" placeholder="พิมพ์ข้อความ เช่น รถออกเดินทางช้ากว่ากำหนด 5 นาที..." value={alertText} onChange={(e) => setAlertText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor, marginBottom: '10px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', width: '100%', cursor: 'pointer' }}>ส่งแจ้งเตือนด่วน</button>
        </form>
      </div>

      {/* แจ้งของหาย */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '12px' }}>🎒 แจ้งของที่พบบบนรถ</h3>
        <form onSubmit={handleReportLostItem}>
          <input type="text" placeholder="ชื่อสิ่งของที่พบ..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor, marginBottom: '10px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', width: '100%', cursor: 'pointer' }}>บันทึกส่งมอบเข้าศูนย์ของหาย</button>
        </form>
      </div>
    </div>
  );
}

// --- 3. หน้าจอฝั่งเจ้าหน้าที่ / แอดมิน (StaffView - เพิ่มระบบรับฟีดแบคและคะแนนรีวิว) ---
function StaffView({ darkMode }: { darkMode: boolean }) {
  const [lostItems, setLostItems] = useState<LostItem[]>(() => {
    const saved = localStorage.getItem('uniride_lost_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [routeSchedules, setRouteSchedules] = useState<RouteSchedule[]>(() => {
    const saved = localStorage.getItem('uniride_routes');
    return saved ? JSON.parse(saved) : [
      { id: 1, routeName: 'สาย 1 (หอพักใน - อาคารเรียนรวม)', times: '08:00, 09:00, 10:00', status: '🟢 เปิดให้บริการ' }
    ];
  });

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    const saved = localStorage.getItem('uniride_feedbacks');
    return saved ? JSON.parse(saved) : [
      { id: 1, category: 'ลืมของ', message: 'ลืมกระเป๋าผ้าสีเทาไว้บนรถสาย 1 ครับ', time: '10:30 น.' }
    ];
  });

  const [lastRating, setLastRating] = useState<string>(() => {
    return localStorage.getItem('uniride_last_rating') || '4.8';
  });

  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteTimes, setNewRouteTimes] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const heatmapData = [
    { stopName: 'ป้ายหอพักชาย', peakTime: '08:00 - 09:00 น.', passengersCount: 48, congestionLevel: '🔴 หนาแน่นมาก (ควรปล่อยรถเสริม)' },
    { stopName: 'ป้ายคณะ IT', peakTime: '09:00 - 10:00 น.', passengersCount: 32, congestionLevel: '🟡 ปานกลาง' },
    { stopName: 'ป้ายโรงอาหารกลาง', peakTime: '12:00 - 13:00 น.', passengersCount: 55, congestionLevel: '🔴 หนาแน่นมาก (ควรปล่อยรถเสริม)' },
    { stopName: 'ป้ายอาคารเรียนรวม', peakTime: '16:00 - 17:00 น.', passengersCount: 20, congestionLevel: '🟢 ปกติ' }
  ];

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim() || !newRouteTimes.trim()) return;
    const newRoute: RouteSchedule = {
      id: Date.now(),
      routeName: newRouteName,
      times: newRouteTimes,
      status: '🟢 เปิดให้บริการ'
    };
    const updatedRoutes = [...routeSchedules, newRoute];
    setRouteSchedules(updatedRoutes);
    localStorage.setItem('uniride_routes', JSON.stringify(updatedRoutes));
    setNewRouteName('');
    setNewRouteTimes('');
    setSuccessMsg('🚐 เพิ่มสายการเดินรถใหม่สำเร็จ!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteRoute = (id: number) => {
    const updatedRoutes = routeSchedules.filter(r => r.id !== id);
    setRouteSchedules(updatedRoutes);
    localStorage.setItem('uniride_routes', JSON.stringify(updatedRoutes));
  };

  const handleUpdateStatus = (id: number, newStatus: LostItem['status']) => {
    const updated = lostItems.map(item => item.id === id ? { ...item, status: newStatus } : item);
    setLostItems(updated);
    localStorage.setItem('uniride_lost_items', JSON.stringify(updated));
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    const newAnnounce: Announcement = {
      id: Date.now(),
      message: announcementText,
      time: new Date().toLocaleTimeString()
    };
    localStorage.setItem('uniride_announcements', JSON.stringify([newAnnounce]));
    setAnnouncementText('');
    setSuccessMsg('📢 ส่งประกาศด่วนถึงหน้านักศึกษาสำเร็จ!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#f8fafc' : '#1e293b';

  return (
    <div style={{ background: cardBg, color: textColor, padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>📊 แดชบอร์ดผู้ดูแลระบบ (Admin Control Center)</h2>

      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>
          {successMsg}
        </div>
      )}

      {/* ส่วนแสดงคะแนนรีวิวและความพึงพอใจของนักศึกษาที่เพิ่มเข้ามาใหม่ */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '6px' }}>⭐ คะแนนรีวิวและความพึงพอใจภาพรวม</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>ประเมินจากนักศึกษาทั้งหมดในระบบ</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>{lastRating} / 5.0</span>
          <span style={{ display: 'block', fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>🟢 อยู่ในเกณฑ์ดีเยี่ยม</span>
        </div>
      </div>

      {/* ส่วนรับความคิดเห็นและปัญหาจากนักศึกษา */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '12px' }}>💬 กล่องข้อความความคิดเห็นและแจ้งปัญหาจากนักศึกษา ({feedbacks.length} รายการ)</h3>
        {feedbacks.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>ยังไม่มีข้อความความคิดเห็นในระบบ</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedbacks.map(fb => (
              <div key={fb.id} style={{ background: darkMode ? '#1e293b' : '#fff', padding: '14px', borderRadius: '10px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>{fb.category}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{fb.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px' }}>{fb.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap Analytics */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '6px' }}>🔥 ระบบวิเคราะห์ความหนาแน่นและแผนที่ความร้อน (Heatmap)</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>วิเคราะห์ช่วงเวลาและป้ายที่มีนักศึกษาหนาแน่นที่สุด</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {heatmapData.map((data, idx) => (
            <div key={idx} style={{ background: darkMode ? '#1e293b' : '#fff', padding: '14px', borderRadius: '10px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>📍 {data.stopName}</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>ช่วงเวลาพีค: {data.peakTime} | เฉลี่ย: <b>{data.passengersCount} คน</b></span>
              </div>
              <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', background: data.passengersCount > 40 ? '#fee2e2' : '#dcfce7', color: data.passengersCount > 40 ? '#991b1b' : '#15803d' }}>
                {data.congestionLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* เพิ่มสายการเดินรถ */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '10px' }}>🚍 จัดการและเพิ่มสายการเดินรถประจำมหาวิทยาลัย</h3>
        <form onSubmit={handleAddRoute} style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input type="text" placeholder="ชื่อสายรถและเส้นทาง..." value={newRouteName} onChange={(e) => setNewRouteName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input type="text" placeholder="รอบเวลาออกรถ (เช่น 08:30, 11:30)..." value={newRouteTimes} onChange={(e) => setNewRouteTimes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>➕ บันทึกเพิ่มสายการเดินรถใหม่</button>
        </form>

        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>รายชื่อสายรถในระบบปัจจุบัน ({routeSchedules.length}):</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {routeSchedules.map(r => (
            <div key={r.id} style={{ background: darkMode ? '#1e293b' : '#fff', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{r.routeName}</span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>รอบเวลา: {r.times}</span>
              </div>
              <button onClick={() => handleDeleteRoute(r.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>ลบ</button>
            </div>
          ))}
        </div>
      </div>

      {/* ประกาศด่วน */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '10px' }}>📢 ระบบส่งประกาศด่วนถึงนักศึกษา</h3>
        <form onSubmit={handleBroadcastAnnouncement}>
          <textarea rows={2} value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="พิมพ์ข้อความประกาศ..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#1e293b' : '#fff', color: textColor, marginBottom: '12px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>ส่งประกาศด่วน</button>
        </form>
      </div>

      {/* จัดการของหาย */}
      <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '20px', borderRadius: '12px', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}` }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '12px' }}>📦 จัดการรายการของหายบนรถ ({lostItems.length} รายการ)</h3>
        {lostItems.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>ยังไม่มีรายการสิ่งของแจ้งหายในระบบ</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lostItems.map(item => (
              <div key={item.id} style={{ background: darkMode ? '#1e293b' : '#fff', padding: '16px', borderRadius: '10px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>🎒 {item.itemName}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>รถ: {item.busRoute} | จุดที่พบ: {item.foundLocation}</p>
                </div>
                <select value={item.status} onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`, background: darkMode ? '#334155' : '#f8fafc', color: textColor, fontSize: '13px', fontWeight: '600' }}>
                  <option value="กำลังตามหาเจ้าของ">กำลังตามหาเจ้าของ</option>
                  <option value="เก็บรักษาอยู่ที่ศูนย์">เก็บรักษาอยู่ที่ศูนย์</option>
                  <option value="ส่งคืนเจ้าของแล้ว">ส่งคืนเจ้าของแล้ว</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [role, setRole] = useState<'student' | 'driver' | 'staff' | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  if (!role) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh', transition: '0.3s', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#fbbf24' : '#64748b', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        <LoginScreen onLogin={(selectedRole) => setRole(selectedRole)} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh', margin: 0, paddingBottom: '40px', color: darkMode ? '#f8fafc' : '#1e293b', transition: '0.3s' }}>
      <header style={{ background: darkMode ? '#1e293b' : '#ffffff', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(to right, #3b82f6, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniRide System 🚐</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>บทบาท: {role === 'student' ? '👨‍🎓 นักศึกษา' : role === 'driver' ? '🚌 คนขับรถ' : '📊 เจ้าหน้าที่'}</span>
          <button onClick={() => setRole(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>ออกจากระบบ</button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#fbbf24' : '#64748b', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{darkMode ? '☀' : '🌙'}</button>
        </div>
      </header>
      <main style={{ maxWidth: '750px', margin: '40px auto', padding: '0 20px' }}>
        {role === 'student' && <StudentView darkMode={darkMode} />}
        {role === 'driver' && <DriverView darkMode={darkMode} />}
        {role === 'staff' && <StaffView darkMode={darkMode} />}
      </main>
    </div>
  );
}