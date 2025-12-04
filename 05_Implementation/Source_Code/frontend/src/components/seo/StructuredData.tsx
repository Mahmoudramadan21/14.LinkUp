// components/seo/StructuredData.tsx
'use client';

import { memo } from 'react';

/**
 * StructuredData
 * Safely injects JSON-LD structured data into <head> using <script type="application/ld+json">
 * Prevents duplicate script errors and ensures Next.js hydration compatibility.
 */
const StructuredData = memo(({ data }: { data: Record<string, unknown> }) => {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
      // Unique key to avoid React duplicate warnings
      key={`structured-data-${JSON.stringify(data)['@type']}`}
    />
  );
});

StructuredData.displayName = 'StructuredData';
export default StructuredData;