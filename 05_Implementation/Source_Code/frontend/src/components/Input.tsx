import React, { ChangeEvent, InputHTMLAttributes, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

/*
 * Input Component
 * A reusable input field with support for labels, error messages, and password visibility toggle.
 * Used in forms for user input, such as login, signup, or profile editing.
 */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string; // Unique identifier for the input
  type?: string; // Input type (e.g., text, password)
  placeholder?: string; // Placeholder text for the input
  label?: string; // Label for the input field
  value: string; // Current value of the input
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; // Callback for input changes
  error?: string; // Optional error message to display
  required?: boolean; // Indicates if the input is required
}

const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  placeholder,
  label,
  value,
  onChange,
  error,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility for password inputs
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="input-block" data-testid="input">
      <div className="input-block__header">
        {label && (
          <label htmlFor={id} className="input-block__label">
            {label}
            {required && (
              <span className="input-block__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="input-block__toggle-password"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            <span className="input-block__toggle-text">{showPassword ? 'Hide' : 'Show'}</span>
          </button>
        )}
      </div>
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-block__input ${error ? 'error' : ''}`}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="input-block__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;