import Cookie from "js-cookie";

interface CookieOptions {
  expires?: number | Date;
  secure?: boolean;
  SameSite?: "Strict" | "Lax" | "None";
  [key: string]: any;
}

// Set a cookie with secure options
export const setCookie = (name: string, value: string, options?: CookieOptions = {}): void => {
    Cookie.set(name, value, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        ...options,
    })
}

// Get a cookie by name
export const getCookie = (name: string): string | undefined => {
    return Cookie.get(name);
}

// Remove a cookie by name
export const removeCookie = (name: string): void => {
    Cookie.remove(name, { path: "" });
}   