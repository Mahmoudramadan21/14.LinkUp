import React, { memo } from 'react';

/*
 * Button Component
 * A reusable button component with customizable variants, sizes, and states.
 * Used for actions like submitting forms, triggering events, or navigation.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset'; // Defines the button type
  children: React.ReactNode; // Content inside the button
  onClick?: () => void; // Click event handler
  disabled?: boolean; // Controls button interactivity
  variant?: 'primary' | 'secondary' | 'tertiary'; // Visual style variant
  size?: 'small' | 'medium' | 'large'; // Button size
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  // Prevent default behavior on disabled buttons for security
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled && onClick) {
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
      className={`
        button-block 
        button-block--${variant} 
        button-block--${size} 
        ${disabled ? 'button-block--disabled' : ''}
      `}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default memo(Button);