"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import {
  getProfileByUsernameThunk,
  getUserSuggestionsThunk,
  getPendingFollowRequestsThunk,
  getFollowersThunk,
  getFollowingThunk,
  clearError,
} from "@/store/profileSlice";
import { FollowRequestItem, FollowUser } from "@/types/profile";
import TabPanel from "@/components/ui/connections/TabPanel";
import styles from "./connections.module.css";

/**
 * ConnectionsPageClient component manages the user's connections interface.
 * It handles tabs for suggestions, followers, following, and pending requests (if applicable).
 * 
 * @returns {JSX.Element} The rendered connections page.
 */
const ConnectionsPageClient = () => {
  // Redux dispatch and state selectors
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { profiles, suggestions, pendingRequests, hasMoreFollowers, hasMoreFollowing, loading, error } = useSelector(
    (state: RootState) => state.profile
  );

  // Active tab from URL params, default to "suggestions"
  const activeTab = (searchParams.get("tab") || "suggestions") as "suggestions" | "requests" | "followers" | "following";

  // State for pagination limits and pages
  const [suggestionsLimit, setSuggestionsLimit] = useState(10);
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);

  /**
   * Updates the URL search parameters without scrolling.
   * 
   * @param {Object} params - Key-value pairs to set or delete in search params.
   */
  const setSearchParams = useCallback(
    (params: { [key: string]: string | null }) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Sets the active tab by updating the URL params.
   * 
   * @param {typeof activeTab} tab - The tab to activate.
   */
  const setActiveTab = useCallback(
    (tab: typeof activeTab) => {
      setSearchParams({ tab });
    },
    [setSearchParams]
  );

  // Type definition for connection tabs
  type ConnectionsTab =
    | {
        id: "suggestions";
        label: string;
        data: FollowUser[];
        hasMore: boolean;
        loading: boolean;
        onLoadMore: () => void;
      }
    | {
        id: "followers";
        label: string;
        data: FollowUser[];
        hasMore: boolean;
        loading: boolean;
        onLoadMore: () => void;
      }
    | {
        id: "following";
        label: string;
        data: FollowUser[];
        hasMore: boolean;
        loading: boolean;
        onLoadMore: () => void;
      }
    | {
        id: "requests";
        label: string;
        data: FollowRequestItem[];
        hasMore: boolean;
        loading: boolean;
        onLoadMore: () => void;
      };

  // Memoized tabs configuration based on user data
  const tabs = useMemo(() => {
    const baseTabs: ConnectionsTab[] = [
      {
        id: "suggestions" as const,
        label: "Suggestions",
        data: suggestions as FollowUser[],
        hasMore: suggestions.length >= suggestionsLimit,
        loading: loading.getSuggestions,
        onLoadMore: () => {
          setSuggestionsLimit((prev) => prev + 10);
          dispatch(getUserSuggestionsThunk({ limit: suggestionsLimit + 10 }));
        },
      },
      {
        id: "followers" as const,
        label: "Followers",
        data: user?.username ? profiles[user.username]?.followers || [] : [],
        hasMore: user?.username ? hasMoreFollowers[user.username] || false : false,
        loading: loading.getFollowers,
        onLoadMore: () => {
          if (user?.username) {
            setFollowersPage((prev) => prev + 1);
            dispatch(getFollowersThunk({ username: user.username, params: { page: followersPage + 1, limit: 10 } }));
          }
        },
      },
      {
        id: "following" as const,
        label: "Following",
        data: user?.username ? profiles[user.username]?.following || [] : [],
        hasMore: user?.username ? hasMoreFollowing[user.username] || false : false,
        loading: loading.getFollowing,
        onLoadMore: () => {
          if (user?.username) {
            setFollowingPage((prev) => prev + 1);
            dispatch(getFollowingThunk({ username: user.username, params: { page: followingPage + 1, limit: 10 } }));
          }
        },
      },
    ];

    // Insert requests tab if user profile is private
    if (user?.isPrivate) {
      baseTabs.splice(1, 0, {
        id: "requests" as const,
        label: "Requests",
        data: pendingRequests,
        hasMore: false,
        loading: loading.getPendingRequests,
        onLoadMore: () => {},
      });
    }

    return baseTabs;
  }, [suggestions, pendingRequests, profiles, user, hasMoreFollowers, hasMoreFollowing, loading, dispatch, suggestionsLimit, followersPage, followingPage]);

  // Fetch initial data on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      dispatch(getProfileByUsernameThunk(user.username));
      if (user.isPrivate) {
        dispatch(getPendingFollowRequestsThunk());
      }
      dispatch(getFollowersThunk({ username: user.username, params: { page: 1, limit: 10 } }));
      dispatch(getFollowingThunk({ username: user.username, params: { page: 1, limit: 10 } }));
    }
  }, [isAuthenticated, user, dispatch]);

  // Fetch suggestions when suggestions tab is active
  useEffect(() => {
    if (activeTab === "suggestions") {
      dispatch(getUserSuggestionsThunk({ limit: suggestionsLimit }));
    }
  }, [dispatch, activeTab, suggestionsLimit]);

  // Clear errors from profile slice
  useEffect(() => {
    const errorKeys: Array<keyof typeof error> = [
      "getSuggestions",
      "getPendingRequests",
      "getFollowers",
      "getFollowing",
      "acceptRequest",
      "rejectRequest",
    ];
    errorKeys.forEach((key) => {
      if (error[key] && typeof error[key] === "string") {
        dispatch(clearError(key));
      }
    });
  }, [error, dispatch]);

  return (
    <div className={styles["connections__container"]} role="main" aria-label="Connections Page">
      {/* Navigation tabs */}
      <nav className={styles["connections__tabs"]} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles["connections__tab"]} ${activeTab === tab.id ? styles["connections__tab--active"] : ""}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      {tabs.map((tab) => (
        activeTab === tab.id && (
          <div
            key={tab.id}
            id={`${tab.id}-panel`}
            role="tabpanel"
            aria-labelledby={tab.id}
            className={styles["connections__tab-panel"]}
          >
            <TabPanel
              type={tab.id}
              data={tab.data}
              hasMore={tab.hasMore}
              loading={tab.loading}
              onLoadMore={tab.onLoadMore}
              isOwnProfile={true}
            />
          </div>
        )
      ))}
    </div>
  );
};

export default ConnectionsPageClient;