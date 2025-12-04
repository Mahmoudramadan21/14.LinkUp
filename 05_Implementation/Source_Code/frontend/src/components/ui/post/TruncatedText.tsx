// components/ui/common/TruncatedText.tsx
import React, { useState } from "react";

/**
 * Props for the TruncatedText component
 */
interface TruncatedTextProps {
  text: string;
  maxChars?: number;
  className?: string;
}

/**
 * Reusable text component that automatically truncates long text
 * with a "See more / See less" toggle button for better readability.
 */
const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxChars = 150,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = text.length > maxChars;
  const displayedText = isExpanded ? text : shouldTruncate ? `${text.slice(0, maxChars)}...` : text;

  return (
    <div className="whitespace-pre-wrap break-words">
      <p className={`${className} transition-all duration-300 ease-in-out`}>
        {displayedText}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="ml-1 text-sm font-medium text-[var(--blue-action)] hover:underline focus:outline-none focus:underline"
            aria-label={isExpanded ? "Show less text" : "Show more text"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </p>
    </div>
  );
};

export default TruncatedText;