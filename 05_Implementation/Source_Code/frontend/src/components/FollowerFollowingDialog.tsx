'use client';

import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import Loading from './Loading';
import { useProfileStore } from '@/store/profileStore';
import { useRouter } from 'next/router';

interface FollowingFollower {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  isPrivate: boolean;
  bio: string | null;
}

interface FollowerFollowingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
  showSearch?: boolean;
  showRemove?: boolean;
  data: FollowingFollower[];
  loading?: boolean;
  error?: string | null;
}

const FollowerFollowingDialog: React.FC<FollowerFollowingDialogProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  showSearch = false,
  showRemove = false,
  data = [],
  loading = false,
  error = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLButtonElement>(null);
  const { authData, removeFollower, unfollowUser, fetchFollowers, fetchFollowing } = useProfileStore();
  const router = useRouter();

  const isOwnProfile = authData?.userId === userId;

  // استخدام useMemo لتجنب إعادة حساب filteredData في كل Render
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profileName && item.profileName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, searchQuery]);

  // Focus Management: نقل الـ Focus للـ Modal لما يفتح
  useEffect(() => {
    if (isOpen && firstFocusableElementRef.current) {
      firstFocusableElementRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard Navigation: إغلاق الـ Modal بالضغط على Esc
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // دالة لمسح المتابع (Remove Follower)
  const handleRemoveFollower = async (followerId: number) => {
    if (!isOwnProfile) return;
    try {
      await removeFollower(followerId);
      await fetchFollowers(userId); // تحديث قائمة المتابعين
    } catch (err: any) {
      console.error('Failed to remove follower:', err);
      alert('Failed to remove follower. Please try again.');
    }
  };

  // دالة لإلغاء المتابعة (Unfollow)
  const handleUnfollow = async (followedUserId: number) => {
    if (!isOwnProfile) return;
    try {
      await unfollowUser(followedUserId);
      await fetchFollowing(userId); // تحديث قائمة المتابعة
    } catch (err: any) {
      console.error('Failed to unfollow:', err);
      alert('Failed to unfollow. Please try again.');
    }
  };

  // إذا الـ Modal مش مفتوح، لا نعرض شيء
  if (!isOpen) return null;

  return (
    <div
      className="follower-following-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={`${type} dialog`}
      onClick={onClose}
    >
      <div
        className="follower-following-dialog__content"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="follower-following-dialog__title">{type}</h2>
        {showSearch && (
          <div className="follower-following-dialog__search">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="follower-following-dialog__search-input"
              aria-label={`Search ${type}`}
            />
          </div>
        )}
        {loading ? (
          <Loading />
        ) : error ? (
          <p className="follower-following-dialog__error" role="alert">
            {error}
          </p>
        ) : (
          <div className="follower-following-dialog__list">
            {filteredData.length === 0 ? (
              <p className="follower-following-dialog__empty">No {type} found</p>
            ) : (
              filteredData.map((item) => (
                <div key={item.userId} className="follower-following-dialog__item">
                  <Link href={`/profile/${item.username}`} className="follower-following-dialog__user">
                    <div className="follower-following-dialog__avatar">
                      <Image
                        src={item.profilePicture || '/avatars/placeholder.jpg'}
                        alt={`${item.username}'s profile picture`}
                        width={48}
                        height={48}
                        className="follower-following-dialog__avatar-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/default.jpg';
                        }}
                      />
                    </div>
                    <div className="follower-following-dialog__info">
                      <p className="follower-following-dialog__name">
                        {item.profileName || item.username}
                      </p>
                      <p className="follower-following-dialog__username">@{item.username}</p>
                    </div>
                  </Link>
                  {isOwnProfile && (
                    <div className="follower-following-dialog__action-btn">
                      {type === 'followers' ? (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={(e) => {
                            handleRemoveFollower(item.userId);
                          }}
                          aria-label={`Remove ${item.username} from followers`}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={(e) => {
                            handleUnfollow(item.userId);
                          }}
                          aria-label={`Unfollow ${item.username}`}
                        >
                          Following
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        <Button
          variant="secondary"
          size="medium"
          onClick={onClose}
          className="follower-following-dialog__close-btn"
          ref={firstFocusableElementRef}
          aria-label="Close dialog"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default memo(FollowerFollowingDialog);