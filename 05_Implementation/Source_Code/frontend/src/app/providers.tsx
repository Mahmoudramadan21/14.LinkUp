'use client';

/**
 * Redux provider component for the LinkUp application.
 * Wraps the application with the Redux store to enable state management.
 */

import { Provider } from 'react-redux';
import store from '@/store';
import type { ReactNode, ReactElement } from 'react';

/**
 * Props for the Providers component.
 * @interface ProvidersProps
 */
interface ProvidersProps {
  /** The child components to be wrapped by the Redux provider. */
  children: ReactNode;
}

/**
 * Provides the Redux store to the application.
 * @param {ProvidersProps} props - The component props.
 * @returns {ReactElement} The Redux provider wrapping the children.
 */
export function Providers({ children }: ProvidersProps): ReactElement {
  return <Provider store={store}>{children}</Provider>;
}
