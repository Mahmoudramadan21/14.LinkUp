// Reusable Button component with Tailwind and BEM
import { ButtonHTMLAttributes } from "react";

// Define props type
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
}

const Button: React.FC<ButtonProps> = ({
  type = "button",
  children,
  onClick,
  disabled = false,
  variant = "primary",
  size = "medium",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button-block button-block--${variant} button-block--${size} ${
        disabled ? "button-block--disabled" : ""
      }`}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;