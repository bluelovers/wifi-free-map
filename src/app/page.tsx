'use client';

import dynamic from 'next/dynamic';

const FacilityMap = dynamic(() => import('../components/FacilityMap'), { ssr: false });

export default function Page() {
  return (
    <main className="map-container">
      <FacilityMap />
    </main>
  );
}
