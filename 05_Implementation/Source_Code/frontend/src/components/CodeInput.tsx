import React, { memo, useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';

// Multi-input field for verification codes or PINs
interface CodeInputProps {
  length: number; // Number of input fields
  onChange: (code: string) => void; // Callback for combined code
  error?: string; // Error message to display
}

const CodeInput: React.FC<CodeInputProps> = ({ length, onChange, error }) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(length).fill(null));

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle input change and focus navigation
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    onChange(newDigits.join(''));

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const newDigits = pastedData.split('').slice(0, length);
    setDigits(newDigits);
    onChange(newDigits.join(''));

    inputRefs.current[Math.min(length - 1, newDigits.length - 1)]?.focus();
  };

  return (
    <fieldset className="code-input" role="group" aria-label="Verification code input">
      <div className="code-input__container">
        {digits.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            className={error ? 'code-input__digit code-input__digit--has-error' : 'code-input__digit'}
            aria-label={`Verification code digit ${index + 1}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'code-input-error' : undefined}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && (
        <span id="code-input-error" className="code-input__error" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </fieldset>
  );
};

export default memo(CodeInput);