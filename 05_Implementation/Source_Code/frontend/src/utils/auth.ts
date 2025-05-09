// Types for auth data
interface AuthData {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string;
  email: string; // إضافة الـ Email هنا
}

// Store auth data in localStorage
export const setAuthData = (data: AuthData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authData', JSON.stringify(data));
  }
};

// Retrieve auth data from localStorage
export const getAuthData = (): AuthData | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  }
  return null;
};

// Remove auth data from localStorage
export const removeAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authData');
  }
};

// Get access token
export const getAccessToken = (): string | null => {
  const authData = getAuthData();
  return authData ? authData.accessToken : null;
};

// Get refresh token
export const getRefreshToken = (): string | null => {
  const authData = getAuthData();
  return authData ? authData.refreshToken : null;
};

// Refresh access token using refresh token
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
    const newAuthData: AuthData = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken || refreshToken, // Keep old refreshToken if not provided
      userId: data.data.userId,
      username: data.data.username,
      profileName: data.data.profileName,
      profilePicture: data.data.profilePicture,
      email: data.data.email || '', // إضافة الـ Email من الـ Response
    };

    setAuthData(newAuthData);
    return newAuthData.accessToken;
  } catch (error) {
    console.error('Refresh token error:', error);
    removeAuthData();
    return null;
  }
};