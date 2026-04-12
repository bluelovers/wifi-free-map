/**
 * 使用者貢獻熱點表單元件
 * User contributed hotspot form component
 *
 * 使用 antd v6 + Next.js 最佳實作：
 * - 使用 Form.useForm() 管理表單狀態
 * - 使用 rules 進行表單驗證
 * - 使用 form.setFieldValue/getFieldValue 操作表單
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, InputNumber, Space } from 'antd';

/**
 * 表單欄位定義
 * Form fields definition
 */
interface IFormValues
{
	/** 熱點名稱 / Hotspot name */
	name: string;
	/** SSID */
	ssid: string;
	/** 密碼（可選） / Password (optional) */
	password?: string;
	/** 緯度 / Latitude */
	lat: number;
	/** 經度 / Longitude */
	lng: number;
	/** 地址（可選） / Address (optional) */
	address?: string;
}

export default function AddHotspotForm({
	onClose,
}: {
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
			const res = await fetch('/api/hotspots/user/route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			const data = await res.json();
			if (data.success)
			{
				// 重新載入首頁或觸發快取更新
				router.refresh();
				onClose();
			}
			else
			{
				alert(data.message || '提交失敗');
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
				<h3>新增熱點</h3>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					initialValues={{
						name: '',
						ssid: '',
						password: '',
						lat: 0,
						lng: 0,
						address: '',
					}}
				>
					<Form.Item
						label="名稱"
						name="name"
						rules={[{ required: true, message: '請輸入熱點名稱' }]}
					>
						<Input placeholder="請輸入熱點名稱" />
					</Form.Item>
					<Form.Item
						label="SSID"
						name="ssid"
						rules={[{ required: true, message: '請輸入 SSID' }]}
					>
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
							<InputNumber
								step="any"
								style={{ width: '100%' }}
								placeholder="請輸入緯度"
							/>
						</Form.Item>
						<Form.Item
							label="經度"
							name="lng"
							rules={[{ required: true, message: '請輸入經度' }]}
							style={{ flex: 1 }}
						>
							<InputNumber
								step="any"
								style={{ width: '100%' }}
								placeholder="請輸入經度"
							/>
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
							{submitting ? '提交中...' : '送出'}
						</Button>
					</Space>
				</Form>
			</div>
		</div>
	);
}
