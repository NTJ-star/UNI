// src/services/busService.ts

export interface BusData {
  route: string;
  lat: number;
  lng: number;
  nextStop: string;
  eta: number;
  passengers: string;
  updatedAt: string;
}

export interface FeedbackItem {
  id: number;
  message: string;
  category: string;
  time: string;
}

export function getBusLocation(): BusData {
  const saved = localStorage.getItem('uniride_current_bus');
  if (saved) return JSON.parse(saved);
  return {
    route: 'สาย 1 (หอพักใน - อาคารเรียนรวม)',
    lat: 18.7883,
    lng: 98.9853,
    nextStop: 'ป้ายหน้าคณะ IT',
    eta: 3,
    passengers: 'ปานกลาง (25 คน)',
    updatedAt: 'กำลังรอสัญญาณ...',
  };
}

export function updateBusLocation(data: BusData) {
  localStorage.setItem('uniride_current_bus', JSON.stringify(data));
}

export function getFeedbacks(): FeedbackItem[] {
  const saved = localStorage.getItem('uniride_feedbacks');
  if (saved) return JSON.parse(saved);
  return [
    { id: 1, message: 'ลืมร่มสีฟ้าไว้บนรถ สาย 1', category: 'ลืมของ', time: '10:30 น.' },
  ];
}

export function addFeedback(message: string, category: string) {
  const list = getFeedbacks();
  const newItem: FeedbackItem = {
    id: Date.now(),
    message,
    category,
    time: new Date().toLocaleTimeString(),
  };
  localStorage.setItem('uniride_feedbacks', JSON.stringify([newItem, ...list]));
}