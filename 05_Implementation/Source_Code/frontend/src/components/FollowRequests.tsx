'use client';
import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';

/*
 * FollowRequests Component
 * Displays a list of follow requests with options to confirm or delete them.
 * Used in user profile or notification sections to manage incoming follow requests.
 */
interface User {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  Bio: string | null;
}

interface FollowRequest {
  requestId: number;
  user: User;
  createdAt: string;
}

interface FollowRequestsProps {
  initialData: {
    count: number;
    followRequests: FollowRequest[];
  };
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

const FollowRequests: React.FC<FollowRequestsProps> = ({ initialData, onAccept, onReject }) => {
  const [requests, setRequests] = useState(initialData.followRequests);

  // Sync local state with prop changes
  useEffect(() => {
    console.log('FollowRequests updated with:', initialData.followRequests); // Debug log
    setRequests(initialData.followRequests);
  }, [initialData.followRequests]);

  // Confirm a follow request and remove it from the list
  const handleConfirm = (requestId: number) => {
    onAccept(requestId);
    setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
  };

  // Delete a follow request and remove it from the list
  const handleDelete = (requestId: number) => {
    onReject(requestId);
    setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
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
      {requests.length === 0 ? (
        <p className="follow-requests-empty">No pending follow requests.</p>
      ) : (
        <div className="follow-requests-list">
          {requests.map((request) => (
            <div key={request.requestId} className="follow-request-item">
              <div className="follow-request-details">
                <Avatar
                  imageSrc={request.user.ProfilePicture || '/avatars/placeholder.png'}
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
      )}
    </div>
  );
};

export default FollowRequests;