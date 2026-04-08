/**
 * 使用者貢獻熱點表單元件
 * User contributed hotspot form component
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 表單欄位定義
 * Form fields definition
 */
interface IFormData {
  /** 熱點名稱 / Hotspot name */
  name: string;
  /** SSID */
  ssid: string;
  /** 密碼（可選） / Password (optional) */
  password?: string;
  /** 經度 / Latitude */
  lat: number;
  /** 緯度 / Longitude */
  lng: number;
  /** 地址（可選） / Address (optional) */
  address?: string;
}

export default function AddHotspotForm({
  onClose,
}: {
  /** 關閉表單的回呼 */
  onClose: () => void;
}) {
  const [form, setForm] = useState<IFormData>({
    name: '',
    ssid: '',
    password: '',
    lat: 0,
    lng: 0,
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotspots/user/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        // 重新載入首頁或觸發快取更新
        router.refresh();
        onClose();
      } else {
        alert(data.message || '提交失敗');
      }
    } catch (err) {
      console.error(err);
      alert('提交過程發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog open className="add-hotspot-dialog">
      <form onSubmit={handleSubmit} className="add-hotspot-form">
        <h3>新增熱點 / Add Hotspot</h3>
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
            {submitting ? '提交中...' : '送出 / Submit'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
