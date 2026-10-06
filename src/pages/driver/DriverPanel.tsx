import { useState, useEffect } from 'react';

interface BusData {
  route: string;
  lat: number;
  lng: number;
  nextStop: string;
  eta: number;
  passengers: string;
  updatedAt: string;
}

export default function DriverPanel({ darkMode }: { darkMode: boolean }) {
  const [route, setRoute] = useState('สาย 1 (หอพักใน - อาคารเรียนรวม)');
  const [nextStop, setNextStop] = useState('ป้ายคณะ IT');
  const [passengers, setPassengers] = useState('ปานกลาง (25 คน)');
  const [statusMsg, setStatusMsg] = useState('พร้อมส่งพิกัด');

  const handleUpdate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const data: BusData = {
          route,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          nextStop,
          eta: Math.floor(Math.random() * 4) + 1,
          passengers,
          updatedAt: new Date().toLocaleTimeString(),
        };
        localStorage.setItem('uniride_current_bus', JSON.stringify(data));
        setStatusMsg('ส่งพิกัด GPS สำเร็จ!');
      }, () => {
        const mock: BusData = {
          route,
          lat: 18.7883 + (Math.random() * 0.002),
          lng: 98.9853 + (Math.random() * 0.002),
          nextStop,
          eta: Math.floor(Math.random() * 3) + 1,
          passengers,
          updatedAt: new Date().toLocaleTimeString(),
        };
        localStorage.setItem('uniride_current_bus', JSON.stringify(mock));
        setStatusMsg('ส่งพิกัดจำลองสำเร็จ!');
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(handleUpdate, 5000);
    return () => clearInterval(timer);
  }, [route, nextStop, passengers]);

  const themeStyle = darkMode ? { background: '#1e293b', color: '#f8fafc' } : { background: '#fff', color: '#2c3e50' };

  return (
    <div style={{ ...themeStyle, padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0 }}>🚗 แผงควบคุมพนักงานขับรถ</h2>
      <p style={{ color: '#27ae60', fontSize: '14px', fontWeight: 'bold' }}>สถานะ: {statusMsg}</p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>เลือกสายที่ขับ:</label>
        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} value={route} onChange={(e) => setRoute(e.target.value)}>
          <option>สาย 1 (หอพักใน - อาคารเรียนรวม)</option>
          <option>สาย 2 (โรงอาหารกลาง - หอสมุด)</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>จุดจอดถัดไป:</label>
        <input style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7', boxSizing: 'border-box' }} type="text" value={nextStop} onChange={(e) => setNextStop(e.target.value)} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>ความหนาแน่นของผู้โดยสาร:</label>
        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} value={passengers} onChange={(e) => setPassengers(e.target.value)}>
          <option>ว่าง (&lt; 10 คน)</option>
          <option>ปานกลาง (25 คน)</option>
          <option>หนาแน่น (เต็มคัน)</option>
        </select>
      </div>

      <button style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }} onClick={handleUpdate}>อัปเดตตำแหน่งและข้อมูลทันที</button>
    </div>
  );
}