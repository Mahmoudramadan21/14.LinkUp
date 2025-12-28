// app/privacy/page.tsx
import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | LinkUp',
  description: 'Learn how LinkUp collects, uses, and protects your personal information with transparency and security.',
  alternates: { canonical: 'https://linkup-app-frontend.vercel.app/privacy' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | LinkUp',
    description: 'Your data is safe with us. Read our full privacy policy.',
    url: 'https://linkup-app-frontend.vercel.app/privacy',
    type: 'website',
    images: [{ url: 'og/og-privacy.png', width: 1200, height: 630 }],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy Policy - LinkUp',
          description: 'LinkUp privacy policy explaining data collection, usage, and your rights.',
          url: 'https://linkup-app-frontend.vercel.app/privacy',
        }}
      />

      <div className={styles.privacy}>
        {/* Hero */}
        <header className={styles.privacy__hero}>
          <h1 className={styles.privacy__title}>Privacy Policy</h1>
          <p className={styles.privacy__subtitle}>
            Your privacy matters. We are committed to protecting your personal information and being transparent about how we use it.
          </p>
          <p className={styles.privacy__updated}>
            Last updated: <strong>December 9, 2025</strong>
          </p>
        </header>

        <article className={styles.privacy__content}>
          {/* 1. Introduction */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>1. Introduction</h2>
            <p className={styles.privacy__text}>
              Welcome to <strong>LinkUp</strong> – a social platform built to bring people closer together. This Privacy Policy explains how we collect, use, share, and protect your information when you use our service.
            </p>
            <p className={styles.privacy__text}>
              By using LinkUp, you agree to the practices described in this policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>2. Information We Collect</h2>
            <div className={styles.privacy__grid}>
              <div className={styles.privacy__card}>
                <h3 className={styles.privacy__cardTitle}>Account Information</h3>
                <ul className={styles.privacy__list}>
                  <li>Name, email, username</li>
                  <li>Hashed password (never stored in plain text)</li>
                  <li>Gender and birthdate (for age-appropriate features)</li>
                </ul>
              </div>
              <div className={styles.privacy__card}>
                <h3 className={styles.privacy__cardTitle}>Profile & Content</h3>
                <ul className={styles.privacy__list}>
                  <li>Profile picture, bio, location, job</li>
                  <li>Posts, stories, highlights, comments, likes</li>
                  <li>Direct messages (encrypted)</li>
                </ul>
              </div>
              <div className={styles.privacy__card}>
                <h3 className={styles.privacy__cardTitle}>Usage & Device Data</h3>
                <ul className={styles.privacy__list}>
                  <li>IP address, browser type, device information</li>
                  <li>Pages visited, interactions, timestamps</li>
                  <li>Search history (stored locally on your device)</li>
                </ul>
              </div>
              <div className={styles.privacy__card}>
                <h3 className={styles.privacy__cardTitle}>Cookies & Authentication</h3>
                <ul className={styles.privacy__list}>
                  <li>Secure session cookies (HttpOnly, Secure flags)</li>
                  <li>Authentication and refresh tokens</li>
                  <li>Preferences (e.g., dark mode)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Data */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>3. How We Use Your Information</h2>
            <ul className={styles.privacy__bullets}>
              <li>To provide and maintain the LinkUp service</li>
              <li>To enable social features (following, messaging, notifications)</li>
              <li>To personalize your feed and suggestions</li>
              <li>To improve performance and user experience</li>
              <li>To detect and prevent abuse, spam, and violations</li>
              <li>To communicate with you (updates, support)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* 4. Data Sharing */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>4. Data Sharing & Third Parties</h2>
            <p className={styles.privacy__text}>
              We <strong>do not sell</strong> your personal data.
            </p>
            <p className={styles.privacy__text}>
              We may share data with trusted service providers (hosting, analytics, email delivery) under strict confidentiality agreements. We may also disclose data when required by law or to protect our rights and users.
            </p>
          </section>

          {/* 5. Security */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>5. Security</h2>
            <ul className={styles.privacy__bullets}>
              <li>Messages are encrypted in transit and at rest</li>
              <li>Passwords are hashed with industry-standard algorithms</li>
              <li>Authentication uses secure, HttpOnly cookies</li>
              <li>Regular security audits and monitoring</li>
              <li>In case of a breach, we will notify affected users promptly</li>
            </ul>
          </section>

          {/* 6. Your Rights */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>6. Your Rights</h2>
            <p className={styles.privacy__text}>You have full control over your data:</p>
            <ul className={styles.privacy__bullets}>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in a readable format</li>
              <li>Object to or restrict certain processing</li>
            </ul>
            <p className={styles.privacy__text}>
              Contact us at{' '}
              <a href="mailto:privacy@linkup.com" className={styles.privacy__link}>
                privacy@linkup.com
              </a>{' '}
              to exercise your rights.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>7. Children&apos;s Privacy</h2>
            <p className={styles.privacy__text}>
              LinkUp is not intended for children under 13. We do not knowingly collect data from minors. If we become aware of such data, we will delete it immediately.
            </p>
          </section>

          {/* 8. International Transfers */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>8. International Data Transfers</h2>
            <p className={styles.privacy__text}>
              Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place, in compliance with GDPR and applicable laws.
            </p>
          </section>

          {/* 9. Changes */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>9. Changes to This Policy</h2>
            <p className={styles.privacy__text}>
              We may update this policy from time to time. Significant changes will be communicated clearly, and the updated date will be shown at the top.
            </p>
          </section>

          {/* 10. Contact */}
          <section className={styles.privacy__section}>
            <h2 className={styles.privacy__sectionTitle}>10. Contact Us</h2>
            <p className={styles.privacy__text}>Have questions about your privacy?</p>
            <a
              href="mailto:privacy@linkup.com"
              className={styles.privacy__cta}
            >
              Email Us: privacy@linkup.com
            </a>
          </section>
        </article>

        {/* Final Note */}
        <footer className={styles.privacy__footer}>
          <p className={styles.privacy__footerText}>
            This policy is part of our commitment to transparency and trust. We built LinkUp to connect people — not to exploit their data.
          </p>
        </footer>
      </div>
    </>
  );
}