'use client';

/**
 * Client wrapper for the PasswordResetSuccessClient component.
 * Applies the withResetEmailProtection HOC to ensure email-based access control.
 */

import withResetEmailProtection from '@/components/guards/withResetEmailProtection';
import PasswordResetSuccessClient from './PasswordResetSuccessClient';
import type { ComponentType } from 'react';

/**
 * Wrapped PasswordResetSuccessClient component with email protection.
 * @type {React.ComponentType}
 */
const PasswordResetSuccessWrapper: ComponentType = withResetEmailProtection(PasswordResetSuccessClient);

export default PasswordResetSuccessWrapper;