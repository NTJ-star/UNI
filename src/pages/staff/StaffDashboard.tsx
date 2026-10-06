import { useState } from 'react';

interface FeedbackItem {
  id: number;
  message: string;
  category: string;
  time: string;
}

export default function StaffDashboard({ darkMode }: { darkMode: boolean }) {
  const [routes, setRoutes] = useState([
    { id: 1, name: 'สาย 1 (หอพักใน - อาคารเรียนรวม)', status: 'เปิดให้บริการ' },
    { id: 2, name: 'สาย 2 (โรงอาหารกลาง - หอสมุด)', status: 'เปิดให้บริการ' },
  ]);
  const [newRoute, setNewRoute] = useState('');
  
  const savedFeedbacks = localStorage.getItem('uniride_feedbacks');
  const feedbacks: FeedbackItem[] = savedFeedbacks ? JSON.parse(savedFeedbacks) : [];

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute) return;
    setRoutes([...routes, { id: Date.now(), name: newRoute, status: 'เปิดให้บริการ' }]);
    setNewRoute('');
  };

  const themeStyle = darkMode ? { background: '#1e293b', color: '#f8fafc' } : { background: '#fff', color: '#2c3e50' };

  return (
    <div style={{ ...themeStyle, padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0 }}>📊 แดชบอร์ดเจ้าหน้าที่และวิเคราะห์สถิติ</h2>
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: darkMode ? '#334155' : '#f8f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: 0, color: '#94a3b8' }}>รถให้บริการ</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', margin: '5px 0 0 0' }}>{routes.length} สาย</p>
        </div>
        <div style={{ flex: 1, background: darkMode ? '#334155' : '#f8f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: 0, color: '#94a3b8' }}>ผู้โดยสารรวม</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', margin: '5px 0 0 0' }}>1,240 คน</p>
        </div>
      </div>

      <div style={{ background: darkMode ? '#334155' : '#fdfefe', padding: '15px', borderRadius: '8px', border: '1px solid #d5dbdb', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>➕ เพิ่มเส้นทางเดินรถใหม่</h3>
        <form onSubmit={handleAddRoute} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="ชื่อเส้นทาง..." value={newRoute} onChange={(e) => setNewRoute(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>เพิ่ม</button>
        </form>
      </div>

      <h3 style={{ fontSize: '16px' }}>📥 กล่องข้อความแจ้งปัญหา / ลืมของ ({feedbacks.length})</h3>
      {feedbacks.length === 0 ? <p style={{ color: '#94a3b8' }}>ยังไม่มีรายการแจ้งปัญหา</p> : (
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {feedbacks.map((item) => (
            <li key={item.id} style={{ marginBottom: '10px', background: darkMode ? '#334155' : '#f8fafc', padding: '10px', borderRadius: '6px' }}>
              <b>[{item.category}]</b> {item.message} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({item.time})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}