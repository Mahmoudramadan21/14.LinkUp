'use client';
import React, { memo, useState, useCallback } from 'react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { UseFormRegisterReturn } from 'react-hook-form';

// Lazy-load icons
const AiOutlineEye = dynamic(() => import('react-icons/ai').then((mod) => mod.AiOutlineEye), {
  ssr: false,
});
const AiOutlineEyeInvisible = dynamic(() =>
  import('react-icons/ai').then((mod) => mod.AiOutlineEyeInvisible),
  { ssr: false }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>,
    'type'
  > {
  id: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'select';
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  options?: SelectOption[];
}

/**
 * Input Component
 * A reusable input field with support for text, password, email, date, select, and error messages.
 * Compatible with react-hook-form for form management.
 */
const Input: React.FC<InputProps & UseFormRegisterReturn> = ({
  id,
  type = 'text',
  placeholder,
  label,
  error,
  required = false,
  options = [],
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Determine input type for password toggle
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Get itemprop based on input type
  const getItemProp = () => {
    switch (id) {
      case 'profileName':
        return 'name';
      case 'username':
        return 'alternateName';
      case 'email':
        return 'email';
      case 'password':
      case 'confirmPassword':
        return 'password';
      case 'dateOfBirth':
        return 'birthDate';
      case 'gender':
        return 'gender';
      default:
        return 'name';
    }
  };

  return (
    <fieldset
      className="input-block"
      data-testid="input"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="input-block__header">
        {label && (
          <label
            htmlFor={id}
            className="input-block__label"
            id={`${id}-label`}
          >
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
            className="input-block__toggle--password"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <AiOutlineEyeInvisible size={20} />
            ) : (
              <AiOutlineEye size={20} />
            )}
            <span className="input-block__toggle-text sr-only">
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </button>
        )}
      </div>
      {type === 'select' ? (
        <select
          id={id}
          {...props}
          className={clsx('input-block__input', {
            'input-block__input--invalid': error,
          })}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          aria-labelledby={`${id}-label`}
          itemProp={getItemProp()}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          {...props}
          className={clsx('input-block__input', {
            'input-block__input--invalid': error,
          })}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          aria-labelledby={`${id}-label`}
          itemProp={getItemProp()}
        />
      )}
      {error && (
        <span
          id={`${id}-error`}
          className="input-block__error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </fieldset>
  );
};

export default memo(Input);