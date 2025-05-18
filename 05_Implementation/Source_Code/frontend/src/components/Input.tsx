'use client';
import React, { memo, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { InputProps } from '@/types';

// Lazy-load icons
const AiOutlineEye = dynamic(() => import('react-icons/ai').then((mod) => mod.AiOutlineEye), {
  ssr: false,
});
const AiOutlineEyeInvisible = dynamic(() =>
  import('react-icons/ai').then((mod) => mod.AiOutlineEyeInvisible),
  { ssr: false }
);

/**
 * Input Component
 * A reusable input field with support for text, password, email, date, select, and error messages.
 */
const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  placeholder,
  label,
  value,
  onChange,
  error,
  required = false,
  options = [],
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const debouncedValue = useDebounce(value, 10);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Determine input type for password toggle
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Get itemprop based on input type
  const getItemProp = () => {
    switch (type) {
      case 'password':
        return 'password';
      case 'email':
        return 'email';
      case 'date':
        return 'birthDate';
      case 'select':
        return 'gender';
      default:
        return 'name';
    }
  };

  return (
    <fieldset
      className="input-block"
      data-testid="input"
      itemscope
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
          name={props.name}
          value={value as string}
          onChange={onChange}
          className={clsx('input-block__input', {
            'input-block__input--invalid': error,
          })}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          aria-labelledby={`${id}-label`}
          itemProp={getItemProp()}
          {...props}
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
          value={debouncedValue as string}
          onChange={onChange}
          className={clsx('input-block__input', {
            'input-block__input--invalid': error,
          })}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          aria-labelledby={`${id}-label`}
          itemProp={getItemProp()}
          {...props}
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

// Custom hook for debouncing input changes
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default memo(Input);