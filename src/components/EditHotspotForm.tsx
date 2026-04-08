/**
 * 熱點編輯表單元件
 * Hotspot edit form component
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { IWiFiHotspot } from '@/types';

/**
 * 表單欄位定義（與新增表單相同）
 */
interface IFormData {
  /** 熱點 ID */
  id: string;
  /** 熱點名稱 */
  name: string;
  /** SSID */
  ssid: string;
  /** 密碼（可選） */
  password?: string;
  /** 緯度 */
  lat: number;
  /** 經度 */
  lng: number;
  /** 地址（可選） */
  address?: string;
}

export default function EditHotspotForm({
  hotspot,
  onClose,
}: {
  /** 要編輯的熱點資料 */
  hotspot: IWiFiHotspot;
  /** 關閉表單的回呼 */
  onClose: () => void;
}) {
  const [form, setForm] = useState<IFormData>({
    id: hotspot.id,
    name: hotspot.name,
    ssid: hotspot.ssid,
    password: hotspot.password ?? '',
    lat: hotspot.location.lat,
    lng: hotspot.location.lng,
    address: hotspot.location.address ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'lat' || name === 'lng' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hotspots/${form.id}/route`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        onClose();
      } else {
        alert(data.message || '更新失敗');
      }
    } catch (err) {
      console.error(err);
      alert('提交過程發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog open className="edit-hotspot-dialog">
      <form onSubmit={handleSubmit} className="edit-hotspot-form">
        <h3>編輯熱點 / Edit Hotspot</h3>
        <label>
          名稱 / Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          SSID
          <input name="ssid" value={form.ssid} onChange={handleChange} required />
        </label>
        <label>
          密碼（可選） / Password (optional)
          <input name="password" value={form.password} onChange={handleChange} />
        </label>
        <label>
          緯度 / Latitude
          <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} required />
        </label>
        <label>
          經度 / Longitude
          <input name="lng" type="number" step="any" value={form.lng} onChange={handleChange} required />
        </label>
        <label>
          地址（可選） / Address (optional)
          <input name="address" value={form.address} onChange={handleChange} />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onClose} disabled={submitting}>
            取消 / Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? '更新中...' : '送出 / Submit'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
