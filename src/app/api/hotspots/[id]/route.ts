/**
 * PUT /api/hotspots/:id – 更新 Wi‑Fi 熱點資料。
 * 直接在 IndexedDB 中更新快取，並回傳最新資料。
 */
import { NextResponse } from 'next/server';
import { openDB, IDBPDatabase } from 'idb';
import type { Hotspot } from '../../../../types/hotspot';

const DB_NAME = 'wifi-free-map-db';
const STORE_NAME = 'hotspots';

async function getDB(): Promise<IDBPDatabase<any>> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    // 簡易驗證：必須包含 id 與其他欄位
    if (!id || !body) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }
    const db = await getDB();
    const cached = await db.get(STORE_NAME, 'latest');
    const data: Hotspot[] = cached?.data ?? [];
    const index = data.findIndex((h) => h.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Hotspot not found' }, { status: 404 });
    }
    // 合併更新欄位
    const updated = { ...data[index], ...body } as Hotspot;
    data[index] = updated;
    // 更新快取並保留 timestamp
    await db.put(STORE_NAME, { timestamp: Date.now(), data }, 'latest');
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error('更新熱點失敗', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
