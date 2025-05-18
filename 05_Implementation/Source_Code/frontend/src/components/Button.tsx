import React, { memo } from 'react';
import clsx from 'clsx';
import { ButtonProps } from '@/types';

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