'use client';
import React, { memo } from 'react';
import Button from '@/components/Button';
import Image from 'next/image';
import { usePasswordResetSuccess } from '@/hooks/usePasswordResetSuccess';

const PasswordResetSuccess: React.FC = () => {
  const { handleContinue } = usePasswordResetSuccess();

  return (
    <section
      className="auth-form auth-form--password-reset-success"
      role="region"
      aria-labelledby="password-reset-success-title"
    >
      <div className="auth-form__container">
        <Image
          src="/svgs/success-checkmark.svg"
          alt=""
          width={64}
          height={64}
          className="auth-form__image--success"
          loading="lazy"
          sizes="64px"
          aria-hidden="true"
        />
        <h1 id="password-reset-success-title" className="auth-form__title auth-form__title--password-reset-success">
          Successfully
        </h1>
        <p className="auth-form__subtitle auth-form__subtitle--password-reset-success" aria-hidden="true">
          Your password has been reset successfully
        </p>
        <Button
          type="button"
          onClick={handleContinue}
          variant="primary"
          size="small"
          aria-label="Continue to login"
        >
          CONTINUE
        </Button>
      </div>
    </section>
  );
};

export default memo(PasswordResetSuccess);