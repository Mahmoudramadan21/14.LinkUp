'use client';
import React, { memo, useState, useEffect, useCallback } from 'react';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

// Interface for user data
interface User {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  Bio: string | null;
}

// Interface for follow request data
interface FollowRequest {
  requestId: number;
  user: User;
  createdAt: string;
}

// Interface for component props
interface FollowRequestsProps {
  initialData: {
    count: number;
    followRequests: FollowRequest[];
  };
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

/**
 * FollowRequests Component
 * Displays a list of follow requests with options to confirm or delete them.
 * Used in user profile or notification sections to manage incoming follow requests.
 */
const FollowRequests: React.FC<FollowRequestsProps> = ({ initialData, onAccept, onReject }) => {
  const [requests, setRequests] = useState<FollowRequest[]>(initialData.followRequests);

  // Sync local state with prop changes
  useEffect(() => {
    setRequests(initialData.followRequests);
  }, [initialData.followRequests]);

  // Confirm a follow request
  const handleConfirm = useCallback(
    (requestId: number) => {
      onAccept(requestId);
      setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
    },
    [onAccept]
  );

  // Delete a follow request
  const handleDelete = useCallback(
    (requestId: number) => {
      onReject(requestId);
      setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
    },
    [onReject]
  );

  // Format time since request was created
  const formatTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }, []);

  return (
    <section
      className="follow-requests__container"
      data-testid="follow-requests"
      itemscope
      itemtype="http://schema.org/ItemList"
    >
      <h2
        className="follow-requests__title"
        id="follow-requests-title"
        aria-label={`Follow requests (${requests.length})`}
      >
        Follow Requests ({requests.length})
      </h2>
      {requests.length === 0 ? (
        <p className="follow-requests__empty" aria-live="polite">
          No pending follow requests.
        </p>
      ) : (
        <div className="follow-requests__list" role="list">
          {requests.map((request) => (
            <div
              key={request.requestId}
              className="follow-request__item"
              role="listitem"
              itemprop="itemListElement"
            >
              <div className="follow-request__details">
                <Avatar
                  imageSrc={request.user.ProfilePicture || '/avatars/placeholder.png'}
                  username={request.user.Username}
                  size="medium"
                  showUsername={false}
                  aria-hidden="true"
                  width={48}
                  height={48}
                  loading="lazy"
                />
                <div>
                  <p className="follow-request__username">@{request.user.Username}</p>
                  <p className="follow-request__time">{formatTimeAgo(request.createdAt)}</p>
                </div>
              </div>
              <div className="follow-request__actions">
                <Button
                  variant="primary"
                  size="small"
                  type="button"
                  onClick={() => handleConfirm(request.requestId)}
                  aria-label={`Confirm follow request from ${request.user.Username}`}
                  className="follow-request__button--confirm"
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  onClick={() => handleDelete(request.requestId)}
                  aria-label={`Delete follow request from ${request.user.Username}`}
                  className="follow-request__button--delete"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default memo(FollowRequests);