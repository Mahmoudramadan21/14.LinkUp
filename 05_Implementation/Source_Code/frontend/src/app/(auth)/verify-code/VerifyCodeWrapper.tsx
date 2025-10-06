'use client';

/**
 * Client wrapper for the VerifyCodeClient component.
 * Applies the withResetEmailProtection HOC to ensure email-based access control.
 */

import withResetEmailProtection from '@/components/guards/withResetEmailProtection';
import VerifyCodeClient from './VerifyCodeClient';
import type { ComponentType } from 'react';

/**
 * Wrapped VerifyCodeClient component with email protection.
 * @type {React.ComponentType}
 */
const VerifyCodeWrapper: ComponentType = withResetEmailProtection(VerifyCodeClient);

export default VerifyCodeWrapper;