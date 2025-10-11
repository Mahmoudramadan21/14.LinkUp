"use client";

/**
 * AuthInitializer Component
 * 
 * Initializes the authentication state by dispatching the `initializeAuth` thunk
 * when the component mounts. This ensures the Redux store is updated with the
 * current user and authentication status on app startup.
 * 
 * @returns {null} Renders nothing to the DOM.
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuth } from "@/store/authSlice";
import type { AppDispatch } from "@/store";

export default function AuthInitializer(): null {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return null;
}