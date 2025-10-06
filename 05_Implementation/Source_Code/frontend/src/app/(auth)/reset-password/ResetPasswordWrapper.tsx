'use client';

/**
 * Client wrapper for the ResetPasswordClient component.
 * Applies the withResetEmailProtection HOC to ensure email-based access control.
 */

import withResetEmailProtection from '@/components/guards/withResetEmailProtection';
import ResetPasswordClient from './ResetPasswordClient';
import type { ComponentType } from 'react';

/**
 * Wrapped ResetPasswordClient component with email protection.
 * @type {React.ComponentType}
 */
const ResetPasswordWrapper: ComponentType = withResetEmailProtection(ResetPasswordClient);

export default ResetPasswordWrapper;