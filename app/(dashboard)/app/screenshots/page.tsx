'use client';

import { ScreenshotsManager } from '@/components/dashboard/screenshots-manager';

// Screenshots now live inside the App Store Page (Store Optimization > App Store
// Page). This route is kept for direct links and simply renders the same manager.
export default function ScreenshotsPage() {
  return (
    <div className="p-8">
      <ScreenshotsManager />
    </div>
  );
}
