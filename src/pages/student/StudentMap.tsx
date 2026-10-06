import { useEffect, useState } from 'react';

interface BusData {
  route: string;
  lat: number;
  lng: number;
  nextStop: string;
  eta: number;
  passengers: string;
  updatedAt: string;
}

interface FeedbackItem {
  id: number;
  message: string;
  category: string;
  time: string;
}

export default function StudentMap({ darkMode }: { darkMode: boolean }) {
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
    };
  });

  const [activeTab, setActiveTab] = useState<'map' | 'schedule' | 'feedback'>('map');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [category, setCategory] = useState('ลืมของ');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('uniride_current_bus');
      if (saved) setBusData(JSON.parse(saved));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    const existing = localStorage.getItem('uniride_feedbacks');
    const list: FeedbackItem[] = existing ? JSON.parse(existing) : [];
    const newItem: FeedbackItem = {
      id: Date.now(),
      message: feedbackMsg,
      category,
      time: new Date().toLocaleTimeString(),
    };
    localStorage.setItem('uniride_feedbacks', JSON.stringify([newItem, ...list]));
    setFeedbackMsg('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const themeStyle = darkMode ? { background: '#1e293b', color: '#f8fafc' } : { background: '#fff', color: '#2c3e50' };

  return (
    <div style={{ ...themeStyle, padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.3s' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('map')} style={{ ...tabBtnStyle, background: activeTab === 'map' ? '#3498db' : '#cbd5e1' }}>🗺️ แผนที่ Real-time</button>
        <button onClick={() => setActiveTab('schedule')} style={{ ...tabBtnStyle, background: activeTab === 'schedule' ? '#3498db' : '#cbd5e1' }}>🕒 ตารางเดินรถ</button>
        <button onClick={() => setActiveTab('feedback')} style={{ ...tabBtnStyle, background: activeTab === 'feedback' ? '#3498db' : '#cbd5e1' }}>💬 แจ้งปัญหา/ติชม</button>
      </div>

      {activeTab === 'map' && (
        <div>
          <div style={{ background: '#e8f8f5', color: '#27ae60', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
            🟢 ติดตามรถแบบ Real-time (Polling)
          </div>

          {busData.eta <= 2 && (
            <div style={{ background: '#fdebd0', borderLeft: '4px solid #e67e22', padding: '12px', borderRadius: '6px', marginBottom: '15px', color: '#784212', fontSize: '14px' }}>
              🚨 <b>แจ้งเตือนด่วน:</b> รถใกล้ถึงจุดจอด "{busData.nextStop}" แล้ว (อีกประมาณ {busData.eta} นาที) โปรดเตรียมตัว!
            </div>
          )}

          <div style={{ background: darkMode ? '#334155' : '#f8f9f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3498db', marginBottom: '20px' }}>
            <p><b>เส้นทาง:</b> {busData.route}</p>
            <p><b>จุดจอดถัดไป:</b> <span style={{ color: '#38bdf8' }}>{busData.nextStop}</span></p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#1e293b' : '#eaf2f8', padding: '10px', borderRadius: '6px', margin: '10px 0', fontWeight: 'bold' }}>
              <span>⏱ เวลามาถึงโดยประมาณ (ETA):</span>
              <span style={{ color: '#ef4444', fontSize: '18px' }}>~ {busData.eta} นาที</span>
            </div>
            <p><b>ความหนาแน่นบนรถ:</b> {busData.passengers}</p>
          </div>

          <div style={{ background: darkMode ? '#0f172a' : '#eaeded', padding: '30px', borderRadius: '8px', textAlign: 'center', border: '2px dashed #cbd5e1' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: darkMode ? '#38bdf8' : '#2c3e50' }}>🗺️ แผนที่จำลองเส้นทางภายในมหาวิทยาลัย</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0' }}>พิกัดปัจจุบัน: Lat {busData.lat.toFixed(4)}, Lng {busData.lng.toFixed(4)}</p>
            <div style={{ marginTop: '15px', background: '#3498db', color: '#fff', padding: '10px 20px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' }}>
              🚐 รถกำลังมุ่งหน้าไปที่: {busData.nextStop}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div>
          <h3>🕒 ตารางเดินรถประจำวัน</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#3498db', color: '#fff' }}>
                <th style={thStyle}>สายรถ</th>
                <th style={thStyle}>เวลาออกรอบ</th>
                <th style={thStyle}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>สาย 1 (หอพักใน - อาคารเรียนรวม)</td><td style={tdStyle}>08:00, 09:00, 10:00</td><td style={{ ...tdStyle, color: '#27ae60' }}>🟢 ตรงเวลา</td></tr>
              <tr><td style={tdStyle}>สาย 2 (โรงอาหารกลาง - หอสมุด)</td><td style={tdStyle}>08:30, 09:30, 10:30</td><td style={{ ...tdStyle, color: '#27ae60' }}>🟢 ตรงเวลา</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          <h3>💬 แจ้งปัญหาหรือลืมของไว้บนรถ</h3>
          {sentSuccess && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>✅ ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่ได้รับเรื่องแล้วครับ</div>}
          <form onSubmit={handleSendFeedback}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ประเภทปัญหา:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
              <option value="ลืมของ">ลืมของบนรถ</option>
              <option value="พฤติกรรมคนขับ">พฤติกรรมคนขับ</option>
              <option value="รถเสีย/ล่าช้า">รถเสีย / ล่าช้าผิดปกติ</option>
            </select>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รายละเอียด:</label>
            <textarea rows={3} value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} placeholder="ระบุรายละเอียด..." style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <button type="submit" style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>ส่งข้อมูล</button>
          </form>
        </div>
      )}
    </div>
  );
}

const tabBtnStyle: React.CSSProperties = { border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const thStyle: React.CSSProperties = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const tdStyle: React.CSSProperties = { padding: '10px', borderBottom: '1px solid #eee' };