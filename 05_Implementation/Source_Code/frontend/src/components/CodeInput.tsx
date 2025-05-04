import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';

/*
 * CodeInput Component
 * A multi-input field for entering verification codes or PINs.
 * Used in authentication flows to collect digit-based codes.
 */
interface CodeInputProps {
  length: number; // Number of input fields for the code
  onChange: (code: string) => void; // Callback with the combined code
  error?: string; // Error message to display
}

const CodeInput: React.FC<CodeInputProps> = ({ length, onChange, error }) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input when the component mounts
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Update digit and manage focus on input change
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    const code = newDigits.join('');
    onChange(code);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle navigation with backspace and arrow keys
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event for multi-digit input
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{4}$/.test(pastedData)) return;

    const newDigits = pastedData.split('').slice(0, length);
    setDigits(newDigits);
    onChange(newDigits.join(''));

    inputRefs.current[length - 1]?.focus();
  };

  return (
    <div className="code-input">
      <div className="code-input__container">
        {digits.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            className={`code-input__digit ${error ? 'error' : ''}`}
            aria-label={`Verification code digit ${index + 1}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'code-error' : undefined}
          />
        ))}
      </div>
      {error && (
        <span id="code-error" className="code-input__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default CodeInput;