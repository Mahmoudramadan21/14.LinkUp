// components/profile/ProfileSkeleton.tsx
/**
 * ProfileSkeleton Component
 * 
 * Skeleton loader for profile page to improve perceived performance during loading.
 * 
 * - Performance: Memoized to avoid re-renders.
 * - Accessibility: Uses ARIA live for polite announcements.
 * - Best Practices: Simple pulse animation for loading effect.
 */

import { memo } from 'react';

/**
 * ProfileSkeleton Component
 */
const ProfileSkeleton = memo(() => (
  <div className="animate-pulse" aria-live="polite" aria-busy="true">
    {/* Avatar Skeleton */}
    <div className="w-36 h-36 rounded-full bg-gray-300 mx-auto" />
    
    {/* Name Skeleton */}
    <div className="h-6 bg-gray-300 w-1/2 mx-auto mt-4" />
    
    {/* Bio Skeleton */}
    <div className="h-4 bg-gray-300 w-3/4 mx-auto mt-2" />
    
    {/* Buttons Skeleton */}
    <div className="flex justify-center gap-4 mt-4">
      <div className="h-10 w-20 bg-gray-300 rounded" />
    </div>
    
    {/* Posts Skeleton */}
    <div className="mt-8 space-y-4">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="h-48 bg-gray-300 rounded-lg" />
      ))}
    </div>
  </div>
));

ProfileSkeleton.displayName = 'ProfileSkeleton';

export default ProfileSkeleton;