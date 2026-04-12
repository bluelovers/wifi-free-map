/**
 * 熱點編輯表單元件
 * Hotspot edit form component
 *
 * 使用 antd v6 + Next.js 最佳實作：
 * - 使用 Form.useForm() 管理表單狀態
 * - 使用 rules 進行表單驗證
 * - 使用 initialValues 初始化表單資料
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, InputNumber, Space } from 'antd';
import type { IWiFiHotspot } from '@/types';

/**
 * 表單欄位定義
 */
interface IFormValues
{
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
})
{
	const [form] = Form.useForm<IFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();

	/**
	 * 處理表單提交
	 * Handle form submission
	 */
	const handleSubmit = async (values: IFormValues) =>
	{
		setSubmitting(true);
		try
		{
			const res = await fetch(`/api/hotspots/${values.id}/route`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			const data = await res.json();
			if (data.success)
			{
				router.refresh();
				onClose();
			}
			else
			{
				alert(data.message || '更新失敗');
			}
		}
		catch (err)
		{
			console.error(err);
			alert('提交過程發生錯誤');
		}
		finally
		{
			setSubmitting(false);
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h3>編輯熱點</h3>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					initialValues={{
						id: hotspot.id,
						name: hotspot.name,
						ssid: hotspot.ssid,
						password: hotspot.password ?? '',
						lat: hotspot.location.lat,
						lng: hotspot.location.lng,
						address: hotspot.location.address ?? '',
					}}
				>
					<Form.Item label="名稱" name="name" rules={[{ required: true, message: '請輸入熱點名稱' }]}>
						<Input placeholder="請輸入熱點名稱" />
					</Form.Item>
					<Form.Item label="SSID" name="ssid" rules={[{ required: true, message: '請輸入 SSID' }]}>
						<Input placeholder="請輸入 SSID" />
					</Form.Item>
					<Form.Item label="密碼（可選）" name="password">
						<Input.Password placeholder="請輸入密碼（可選）" />
					</Form.Item>
					<Space className="form-container" size="middle">
						<Form.Item
							label="緯度"
							name="lat"
							rules={[{ required: true, message: '請輸入緯度' }]}
							style={{ flex: 1 }}
						>
							<InputNumber step="any" style={{ width: '100%' }} placeholder="請輸入緯度" />
						</Form.Item>
						<Form.Item
							label="經度"
							name="lng"
							rules={[{ required: true, message: '請輸入經度' }]}
							style={{ flex: 1 }}
						>
							<InputNumber step="any" style={{ width: '100%' }} placeholder="請輸入經度" />
						</Form.Item>
					</Space>
					<Form.Item label="地址（可選）" name="address">
						<Input placeholder="請輸入地址（可選）" />
					</Form.Item>
					<Space className="form-actions">
						<Button onClick={onClose} disabled={submitting}>
							取消
						</Button>
						<Button type="primary" htmlType="submit" loading={submitting}>
							{submitting ? '更新中...' : '送出'}
						</Button>
					</Space>
				</Form>
			</div>
		</div>
	);
}
