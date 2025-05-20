'use client';
import React, { memo } from 'react';
import Image from 'next/image';

/*
 * PrivateAccountNotice Component
 * Displays a notice for private accounts, indicating restricted access.
 * Optimized for accessibility and SEO with semantic HTML and ARIA attributes.
 */
const PrivateAccountNotice: React.FC = () => {
  return (
    <section className="private-notice__container" role="alert" aria-labelledby="private-notice-title">
      <article className="private-notice__content">
        <Image
          src="/icons/locked-profile.svg"
          alt="Locked profile indicating private account"
          width={48}
          height={48}
          className="private-notice__icon"
          loading="lazy"
        />
        <h2 id="private-notice-title" className="private-notice__title">
          This Account is Private
        </h2>
        <p className="private-notice__description">
          Follow this account to see their posts and activity.
        </p>
      </article>
    </section>
  );
};

export default memo(PrivateAccountNotice);