import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import styles from './terms.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service | LinkUp',
  description: 'Read the terms of service for LinkUp – your rights, responsibilities, and platform rules.',
  alternates: { canonical: 'https://linkup-app-frontend.vercel.app/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms of Service | LinkUp',
    description: 'Your rights and responsibilities on LinkUp. Read our terms.',
    url: 'https://linkup-app-frontend.vercel.app/terms',
    type: 'website',
    images: [{ url: 'og/og-terms.png', width: 1200, height: 630 }],
  },
};

export default function TermsPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service - LinkUp',
          description: 'LinkUp terms of service explaining rules, user responsibilities, and policies.',
          url: 'https://linkup-app-frontend.vercel.app/terms',
        }}
      />

      <div className={styles.terms}>
        {/* Hero Section */}
        <header className={styles.terms__hero}>
          <h1 className={styles.terms__title}>Terms of Service</h1>
          <p className={styles.terms__subtitle}>
            Please read these terms carefully before using LinkUp. They outline your rights and responsibilities while using our platform.
          </p>
          <p className={styles.terms__updated}>
            Last updated: <strong>December 12, 2025</strong>
          </p>
        </header>

        {/* Main Content */}
        <article className={styles.terms__content}>

          {/* 1. Acceptance of Terms */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>1. Acceptance of Terms</h2>
            <p className={styles.terms__text}>
              By accessing or using LinkUp, you agree to be bound by these Terms of Service. If you do not agree, you must not use our platform.
            </p>
          </section>

          {/* 2. Account Responsibilities */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>2. Account Responsibilities</h2>
            <ul className={styles.terms__bullets}>
              <li>Keep your account credentials secure and confidential.</li>
              <li>Provide accurate and up-to-date information during registration.</li>
              <li>Do not impersonate others or create multiple accounts for fraudulent purposes.</li>
            </ul>
          </section>

          {/* 3. Acceptable Use */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>3. Acceptable Use</h2>
            <p className={styles.terms__text}>
              Users must comply with all applicable laws and refrain from content or behavior that is illegal, harmful, or offensive.
            </p>
            <ul className={styles.terms__bullets}>
              <li>No harassment, threats, or abusive content.</li>
              <li>No spamming, phishing, or fraudulent activity.</li>
              <li>No uploading of viruses, malware, or malicious code.</li>
            </ul>
          </section>

          {/* 4. Content Ownership */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>4. Content Ownership</h2>
            <p className={styles.terms__text}>
              You retain ownership of your content. By posting on LinkUp, you grant us a license to use, display, and distribute your content in accordance with our platform functionality.
            </p>
          </section>

          {/* 5. Termination */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>5. Termination</h2>
            <p className={styles.terms__text}>
              We may suspend or terminate accounts that violate these terms or engage in harmful behavior. Users may also close their accounts at any time.
            </p>
          </section>

          {/* 6. Disclaimers and Limitation of Liability */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>6. Disclaimers & Limitation of Liability</h2>
            <p className={styles.terms__text}>
              LinkUp is provided &quot;as is&quot; without warranties of any kind. We are not liable for damages resulting from your use of the platform.
            </p>
          </section>

          {/* 7. Changes to Terms */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>7. Changes to Terms</h2>
            <p className={styles.terms__text}>
              We may update these terms occasionally. Changes will be communicated via the platform, and continued use constitutes acceptance.
            </p>
          </section>

          {/* 8. Contact Information */}
          <section className={styles.terms__section}>
            <h2 className={styles.terms__sectionTitle}>8. Contact Us</h2>
            <p className={styles.terms__text}>
              For questions about these terms, reach out to us at{' '}
              <a href="mailto:terms@linkup.com" className={styles.terms__link}>
                terms@linkup.com
              </a>.
            </p>
          </section>
        </article>

        {/* Footer */}
        <footer className={styles.terms__footer}>
          <p className={styles.terms__footerText}>
            These Terms of Service are part of our commitment to transparency and trust. Your responsible use of LinkUp helps keep the community safe and enjoyable.
          </p>
        </footer>
      </div>
    </>
  );
}
