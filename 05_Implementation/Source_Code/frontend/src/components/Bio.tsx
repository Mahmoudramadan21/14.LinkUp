import Image from 'next/image';
import React, { memo, useMemo } from 'react';
import { BioProps } from '@/types';

/*
 * Bio Component
 * Displays user bio, job title, address, and date of birth with icons.
 * Optimized for SEO, accessibility, performance, and best practices.
 */
const Bio: React.FC<BioProps> = ({
  bio = 'No bio available.',
  address = 'Not specified',
  jobTitle = 'Not specified',
  dateOfBirth = '',
}) => {
  // Format date of birth with validation
  const formattedDateOfBirth = useMemo(() => {
    if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime())) {
      return 'Not specified';
    }
    return new Date(dateOfBirth).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dateOfBirth]);

  return (
    <section className="bio__container" aria-labelledby="bio-title">
      {/* Bio Description */}
      <div className="bio__section">
        <h3 id="bio-title" className="bio__title">
          Bio
        </h3>
        <p className="bio__text">{bio}</p>
      </div>

      {/* Profile Details */}
      <dl className="bio__details">
        {/* Job Title */}
        <div className="bio__field">
          <dt className="bio__field-label">
            <Image
              src="/icons/job.svg"
              width={20}
              height={20}
              alt=""
              className="bio__field-icon"
              aria-hidden="true"
              loading="lazy"
            />
            <span className="sr-only">Job Title</span>
          </dt>
          <dd className="bio__field-value">{jobTitle}</dd>
        </div>

        {/* Address */}
        <div className="bio__field">
          <dt className="bio__field-label">
            <Image
              src="/icons/location.svg"
              width={20}
              height={20}
              alt=""
              className="bio__field-icon"
              aria-hidden="true"
              loading="lazy"
            />
            <span className="sr-only">Address</span>
          </dt>
          <dd className="bio__field-value">{address}</dd>
        </div>

        {/* Date of Birth */}
        <div className="bio__field">
          <dt className="bio__field-label">
            <Image
              src="/icons/date.svg"
              width={20}
              height={20}
              alt=""
              className="bio__field-icon"
              aria-hidden="true"
              loading="lazy"
            />
            <span className="sr-only">Date of Birth</span>
          </dt>
          <dd className="bio__field-value">{formattedDateOfBirth}</dd>
        </div>
      </dl>
    </section>
  );
};

export default memo(Bio);