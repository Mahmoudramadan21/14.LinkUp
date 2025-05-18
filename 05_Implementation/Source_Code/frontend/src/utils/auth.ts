import { FeedStoreAuthData } from '@/types';

export const setAuthData = (data: FeedStoreAuthData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authData', JSON.stringify(data));
  }
};

export const getAuthData = (): FeedStoreAuthData | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const removeAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authData');
  }
};

export const getAccessToken = (): string | null => {
  const authData = getAuthData();
  return authData ? authData.accessToken : null;
};

export const getRefreshToken = (): string | null => {
  const authData = getAuthData();
  return authData ? authData.refreshToken : null;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newAuthData: FeedStoreAuthData = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken || refreshToken,
      userId: data.data.userId,
      username: data.data.username,
      profileName: data.data.profileName,
      profilePicture: data.data.profilePicture,
      email: data.data.email || '',
    };

    setAuthData(newAuthData);
    return newAuthData.accessToken;
  } catch (error) {
    console.error('Refresh token error:', error);
    removeAuthData();
    return null;
  }
};