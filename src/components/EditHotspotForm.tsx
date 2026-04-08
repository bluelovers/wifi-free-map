/**
 * 熱點編輯表單元件
 * Hotspot edit form component
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, InputNumber, Space } from 'antd';
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
      }}>
        <h3 style={{ marginBottom: '16px' }}>編輯熱點</h3>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="名稱" name="name" rules={[{ required: true }]}>
            <Input value={form.name} onChange={handleChange} />
          </Form.Item>
          <Form.Item label="SSID" name="ssid" rules={[{ required: true }]}>
            <Input value={form.ssid} onChange={handleChange} />
          </Form.Item>
          <Form.Item label="密碼（可選）" name="password">
            <Input.Password value={form.password} onChange={handleChange} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="緯度" name="lat" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber step="any" value={form.lat} onChange={(value) => handleChange({ target: { name: 'lat', value } } as any)} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="經度" name="lng" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber step="any" value={form.lng} onChange={(value) => handleChange({ target: { name: 'lng', value } } as any)} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item label="地址（可選）" name="address">
            <Input value={form.address} onChange={handleChange} />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button onClick={onClose} disabled={submitting}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {submitting ? '更新中...' : '送出'}
            </Button>
          </Space>
        </Form>
      </div>
    </div>
  );
}
