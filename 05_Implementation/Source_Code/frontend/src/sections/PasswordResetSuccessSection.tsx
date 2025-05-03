import React from 'react';
import Button from '@/components/Button';
import Image from 'next/image';
import successCheckmark from "../../public/svgs/success-checkmark.svg"

interface PasswordResetSuccessSectionProps {
  onContinue: () => void;
}

const PasswordResetSuccessSection: React.FC<PasswordResetSuccessSectionProps> = ({ onContinue }) => {
  return (
    <section className="auth-form auth-form--password-reset-success">
      <div className="auth-form__container">
        <Image
          src={successCheckmark}
          alt="Success checkmark"
          width={64}
          height={64}
          className="auth-form__success-image"
          priority
        />
        <h1 className="auth-form__title">Successfully</h1>
        <p className="auth-form__subtitle">
          Your password has been reset successfully
        </p>
        <Button
          onClick={onContinue}
          variant="primary"
          size='small'
        //   className="auth-form__button"
          aria-label="Continue to login"
        >
          CONTINUE
        </Button>
      </div>
    </section>
  );
};

export default PasswordResetSuccessSection;