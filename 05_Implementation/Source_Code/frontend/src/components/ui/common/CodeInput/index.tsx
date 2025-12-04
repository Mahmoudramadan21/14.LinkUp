import React, {
  memo,
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import styles from "./CodeInput.module.css";

interface CodeInputProps {
  length: number;
  onChange: (code: string) => void;
  error?: string;
}

/**
 * CodeInput Component
 *
 * A set of single-character numeric inputs for entering verification codes (e.g. OTP, 2FA).
 * - Supports keyboard navigation (arrows, backspace, delete).
 * - Handles pasting full codes directly.
 * - Accessible with ARIA attributes.
 *
 * @component
 */
const CodeInput: React.FC<CodeInputProps> = ({ length, onChange, error }) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(length).fill(null)
  );

  /**
   * Focus the first input automatically on mount.
   */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * Reset all inputs and refocus if an error occurs.
   * This gives the user a clean state to re-enter the code.
   */
  useEffect(() => {
    if (error) {
      setDigits(Array(length).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  /**
   * Handle value change in a single input.
   * - Updates the corresponding digit.
   * - Calls `onChange` with the new full code.
   * - Moves focus to the next input automatically.
   */
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return; // Only allow a single digit

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    onChange(newDigits.join(""));

    // Auto-focus next input when a digit is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle keyboard navigation and deletion.
   * - Backspace: clear or move focus back.
   * - Delete: clear current digit.
   * - Arrow keys: move between inputs.
   * - Numeric key: overwrite and auto-select text.
   */
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    const target = e.currentTarget;

    if (e.key === "Backspace") {
      if (digits[index]) {
        // If there's a digit, clear it first
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // If empty, move focus back
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Delete" && digits[index]) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      onChange(newDigits.join(""));
    }

    // Auto-select when typing a digit over an existing one
    if (/^[0-9]$/.test(e.key)) {
      target.select?.();
    }
  };

  /**
   * Handle pasting a full code.
   * - Splits pasted text into digits.
   * - Fills available inputs up to the max length.
   * - Triggers onChange with the complete code.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const newDigits = pastedData.split("").slice(0, length);
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Focus last filled input
    inputRefs.current[Math.min(length - 1, newDigits.length - 1)]?.focus();
  };

  return (
    <fieldset
      className={styles["code-input"]}
      role="group"
      aria-label="Verification code input"
    >
        <div className="code-input__container">
        {digits.map((digit, index) => (
          <input
            key={index}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
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
            className={
              error
                ? `${styles["code-input__digit"]} ${styles["code-input__digit--has-error"]}`
                : styles["code-input__digit"]
            }
            aria-label={`Verification code digit ${index + 1}`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "code-input-error" : undefined}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <span
          id="code-input-error"
          className={styles["code-input__error"]}
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </fieldset>
  );
};

export default memo(CodeInput);
