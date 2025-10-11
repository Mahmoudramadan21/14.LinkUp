/**
 * Reusable Button component with customizable variants and sizes.
 * Supports primary, secondary, and tertiary styles, with accessibility features.
 * @param props - The button properties.
 * @param props.type - The button type (e.g., 'button', 'submit', 'reset').
 * @param props.children - The content inside the button.
 * @param props.onClick - Optional click handler for the button.
 * @param props.disabled - Whether the button is disabled.
 * @param props.variant - Button style variant ('primary', 'secondary', 'tertiary').
 * @param props.size - Button size ('small', 'medium', 'large').
 * @param props.ariaLabel - Accessibility label for the button.
 * @param props - Additional HTML button attributes.
 * @returns A styled button element with proper accessibility.
 */
import { memo } from 'react';
import clsx from 'clsx';

// Define allowed variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel?: string;
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

  /**
   * Handles button click events.
   * Prevents actions when disabled and triggers the provided onClick handler.
   */
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
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