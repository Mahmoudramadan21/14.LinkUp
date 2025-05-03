import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";

// Define props type
interface CodeInputProps {
  length: number;
  onChange: (code: string) => void;
  error?: string;
}

const CodeInput: React.FC<CodeInputProps> = ({ length, onChange, error }) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return; // Allow only numbers or empty

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Call onChange with the combined code
    const code = newDigits.join("");
    onChange(code);

    // Move focus to the next input if a digit is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace and arrow key navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{4}$/.test(pastedData)) return; // Ensure pasted data is 4 digits

    const newDigits = pastedData.split("").slice(0, length);
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Focus the last input after paste
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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange(index, e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(index, e)
            }
            onPaste={handlePaste}
            ref={(el) => {
                inputRefs.current[index] = el;
              }}
            className={`code-input__digit ${error ? "code-input__digit--error" : ""}`}
            aria-label={`Verification code digit ${index + 1}`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "code-error" : undefined}
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