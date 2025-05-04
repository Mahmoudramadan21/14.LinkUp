import React, { useState } from 'react';
import Avatar from '../components/Avatar';

/*
 * FollowRequests Component
 * Displays a list of follow requests with options to confirm or delete them.
 * Used in user profile or notification sections to manage incoming follow requests.
 */
interface User {
  UserID: number; // Unique identifier for the user
  Username: string; // User's unique handle
  ProfilePicture: string; // URL of the user's profile picture
  Bio: string | null; // User's bio, if available
}

interface FollowRequest {
  requestId: number; // Unique identifier for the follow request
  user: User; // User who sent the request
  createdAt: string; // Timestamp of when the request was created
}

interface FollowRequestsProps {
  initialData: {
    count: number; // Total number of follow requests
    followRequests: FollowRequest[]; // List of follow requests
  };
}

const FollowRequests: React.FC<FollowRequestsProps> = ({ initialData }) => {
  const [requests, setRequests] = useState(initialData.followRequests);

  // Confirm a follow request and remove it from the list
  const handleConfirm = (requestId: number) => {
    setRequests(requests.filter((req) => req.requestId !== requestId));
  };

  // Delete a follow request and remove it from the list
  const handleDelete = (requestId: number) => {
    setRequests(requests.filter((req) => req.requestId !== requestId));
  };

  // Format the time since the request was created
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="follow-requests-container" data-testid="follow-requests">
      <h2 className="follow-requests-title">Follow Requests ({requests.length})</h2>
      <div className="follow-requests-list">
        {requests.map((request) => (
          <div key={request.requestId} className="follow-request-item">
            <div className="follow-request-details">
              <Avatar
                imageSrc={request.user.ProfilePicture}
                username={request.user.Username}
                size="medium"
                showUsername={false}
              />
              <div>
                <p className="follow-request-username">@{request.user.Username}</p>
                <p className="follow-request-time">{formatTimeAgo(request.createdAt)}</p>
              </div>
            </div>
            <div className="follow-request-actions">
              <button
                onClick={() => handleConfirm(request.requestId)}
                className="follow-request-confirm"
                aria-label={`Confirm follow request from ${request.user.Username}`}
              >
                Confirm
              </button>
              <button
                onClick={() => handleDelete(request.requestId)}
                className="follow-request-delete"
                aria-label={`Delete follow request from ${request.user.Username}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowRequests;