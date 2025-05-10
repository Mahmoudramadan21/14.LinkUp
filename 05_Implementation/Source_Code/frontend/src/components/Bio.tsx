import Image from 'next/image';
import React from 'react';

// Define the Props interface for the Bio
interface BioProps {
  bio: string;
  address: string;
  jobTitle: string;
  dateOfBirth: string;
}

const Bio: React.FC<BioProps> = ({
  bio,
  address,
  jobTitle,
  dateOfBirth,
}) => {
  // Format the date of birth to a readable format (e.g., "January 1, 1970")
  const formattedDateOfBirth = new Date(dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bio">
      {/* Bio Section */}
      <div className="bio__bio">
        <h3 className="bio__title">Bio</h3>
        <p className="bio__text">{bio || 'No bio available.'}</p>
      </div>

      {/* Job Title Section */}
      <div className="bio__job-title">
        <Image src='/icons/job.svg' width={18} height={18} alt="Job Icon" />
        <p className="bio__text">{jobTitle || 'Not specified'}</p>
      </div>

      {/* Address Section */}
      <div className="bio__address">
        <Image src='/icons/location.svg' width={18} height={18} alt="Location Icon" />
        <p className="bio__text">{address || 'Not specified'}</p>
      </div>

      {/* Date of Birth Section */}
      <div className="bio__date-of-birth">
        <Image src='/icons/date.svg' width={18} height={18} alt="Date Icon" />
        <p className="bio__text">{formattedDateOfBirth || 'Not specified'}</p>
      </div>
    </div>
  );
};

export default Bio;