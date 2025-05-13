import React, { memo } from 'react';
import clsx from 'clsx';

// Reusable button with customizable variants, sizes, and states
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset'; // Button type for forms
  children: React.ReactNode; // Button content
  onClick?: () => void; // Click event handler
  disabled?: boolean; // Disables button
  variant?: 'primary' | 'secondary' | 'tertiary'; // Visual style
  size?: 'small' | 'medium' | 'large'; // Button size
  ariaLabel?: string; // Accessibility label for icon-only buttons
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  ...props
}) => {
  // Prevent clicks on disabled buttons
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      className={clsx(
        'button-block',
        `button-block--${variant}`,
        `button-block--${size}`,
        { 'button-block--is-disabled': disabled }
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default memo(Button);