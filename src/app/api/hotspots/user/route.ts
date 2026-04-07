import { NextResponse } from 'next/server';
import type { IWiFiHotspot } from '@/types';
import { saveHotspot } from '@/lib/db';

/**
 * POST 處理函式
 * POST handler - 新增用戶貢獻的 WiFi 熱點
 *
 * @param request - 請求物件
 * @returns 新增的熱點
 */
export async function POST(request: Request)
{
    try
    {
        const body = await request.json();

        // 驗證必要欄位
        const { name, ssid, lat, lng, address, provider } = body;
        if (!name || !ssid || !lat || !lng || !address)
        {
            return NextResponse.json(
                {
                    success: false,
                    error: '缺少必要欄位',
                },
                { status: 400 }
            );
        }

        // 建立新的熱點物件
        const newHotspot: IWiFiHotspot = {
            id: `user-${Date.now()}`,
            source: 'user_contributed',
            name,
            ssid,
            password: body.password || undefined,
            location: {
                lat: Number(lat),
                lng: Number(lng),
                address,
            },
            provider: provider || '用戶貢獻',
            isFree: body.isFree !== false,
            isOpen: body.isOpen !== false,
            openTime: body.openTime,
            createdAt: new Date(),
            createdBy: body.createdBy || '匿名',
            verified: false, // 需要驗證
        };

        // 儲存到 IndexedDB
        await saveHotspot(newHotspot);

        return NextResponse.json({
            success: true,
            data: newHotspot,
        });
    }
    catch (error)
    {
        console.error('新增熱點失敗 / Failed to add hotspot:', error);
        return NextResponse.json(
            {
                success: false,
                error: '無法新增熱點',
            },
            { status: 500 }
        );
    }
}

/**
 * GET 處理函式
 * GET handler - 取得用戶貢獻的熱點
 *
 * @returns 用戶貢獻的熱點列表
 */
export async function GET()
{
    try
    {
        const { getHotspotsBySource } = await import('@/lib/db');
        const hotspots = await getHotspotsBySource('user_contributed');

        return NextResponse.json({
            success: true,
            data: hotspots,
            total: hotspots.length,
        });
    }
    catch (error)
    {
        console.error('取得用戶熱點失敗 / Failed to get user hotspots:', error);
        return NextResponse.json(
            {
                success: false,
                error: '無法取得熱點',
            },
            { status: 500 }
        );
    }
}