// Reusable Input component with Tailwind and BEM
import { ChangeEvent, InputHTMLAttributes, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// Define props type
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  id: string;
  type?: string;
  placeholder?: string;
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  id,
  type = "text",
  placeholder,
  label,
  value,
  onChange,
  error,
  required = false,
  ...props
}) => {
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Determine the input type based on password visibility
  const inputType = type === "password" && showPassword ? "text" : type;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="input-block">
      {/* Label and Password Toggle Container */}
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
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="input-block__toggle-password"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <AiOutlineEyeInvisible size={20} />
            ) : (
              <AiOutlineEye size={20} />
            )}
            <span className="input-block__toggle-text">
              {showPassword ? "Hide" : "Show"}
            </span>
          </button>
        )}
      </div>

      {/* Input Field */}
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-block__input ${error ? "input-block__input--error" : ""}`}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <span id={`${id}-error`} className="input-block__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;