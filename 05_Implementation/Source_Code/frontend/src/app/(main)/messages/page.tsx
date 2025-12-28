import StructuredData from '@/components/seo/StructuredData';
import styles from './messages.module.css';


/**
 * Server Component – Messages Page (Empty State)
 *
 * Responsibilities:
 * - Provide non-indexable, privacy-focused metadata
 * - Serve fallback UI when no chat is selected (desktop/tablet)
 * - Maintain accessibility for assistive screen readers
 */
export default function MessagesPage() {
  return (
    <>
      {/* Structured Data – Messaging WebApp */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'LinkUp Messages',
          description:
            'A private messaging interface that lets users chat and connect instantly.',
          url: 'https://linkup-app-frontend.vercel.app/messages',
          applicationCategory: 'SocialNetworking',
          operatingSystem: 'All',
        }}
      />

      <section
        className={`${styles['messages__chat_window']} ${styles['messages__empty_state']}`}
        aria-live="polite"
        role="region"
        aria-label="No conversation selected"
      >
        <div className={styles['messages__empty_content']}>
          <p className={styles['messages__empty_title']}>Your messages</p>
          <p className={styles['messages__empty_desc']}>
            Select a conversation to start chatting
          </p>
        </div>
      </section>
    </>
  );
}
