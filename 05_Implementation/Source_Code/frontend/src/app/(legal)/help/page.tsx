// app/help/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import StructuredData from '@/components/seo/StructuredData';
import styles from './help.module.css';

export const metadata: Metadata = {
  title: 'Help Center | LinkUp',
  description: 'Find answers to frequently asked questions about using LinkUp – stories, posts, privacy, messages, and more.',
  alternates: { canonical: 'https://linkup-app-frontend.vercel.app/help' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'LinkUp Help Center',
    description: 'Everything you need to know about using LinkUp.',
    url: 'https://linkup-app-frontend.vercel.app/help',
    type: 'website',
    images: [{ url: 'og/og-help.png', width: 1200, height: 630 }],
  },
};

const sections = [
    {
    id: 'getting-started',
    title: 'Getting Started',
    cards: [
        {
        title: 'Sign Up',
        steps: [
            'Go to the Sign Up page.',
            'Enter your name, email, username, password, gender, and birthdate.',
            'Submit the form to create your account.',
            'After successful signup, you will land on the Feed.',
        ],
        },
        {
        title: 'Login',
        steps: [
            'Go to the Login page.',
            'Enter your email or username and password.',
            'Click "Log In" to access your account.',
        ],
        },
        {
        title: 'Forgot Password Flow',
        steps: [
            'Go to the "Forgot Password" page.',
            'Enter your registered email address.',
            'Check your email for a verification code.',
            'Enter the code to receive a temporary reset-token.',
            'Set your new password securely.',
        ],
        },
        {
        title: 'Feed Overview',
        steps: [
            'The Feed shows posts from users you follow and suggested content.',
            'You can like, comment, reply, share, save, or report posts.',
            'Stories appear at the top; highlights are grouped on user profiles.',
        ],
        },
    ],
    },
    {
    id: 'accounts-security',
    title: 'Accounts & Security',
    content:
        'Manage your profile, password, privacy level, and account deletion anytime from the Edit Profile page.',
    list: [
        'Authentication uses secure HttpOnly cookies.',
        'All passwords are hashed and validated on both client and server.',
        'Deleting an account requires explicit confirmation.',
    ],
    },
    {
    id: 'posts-stories',
    title: 'Posts, Stories & Highlights',
    content:
        'Create posts with text, images, or video. Add stories using your media or ready-made templates. Your stories can be grouped into permanent highlights displayed on your profile.',
    actions:
        'Supported actions: Like, Comment, Reply, Share, Save, Report, and Edit/Delete (for your own content).',
    },
    {
    id: 'privacy-safety',
    title: 'Privacy & Safety',
    content:
        'Private accounts hide posts, stories, highlights, and follower lists from users who are not approved followers.',
    link: { text: 'Privacy Policy', href: '/privacy' },
    },
];

const faq = [
  { q: 'How do stories work?', a: 'You can create stories from your uploads or use ready-made templates. Stories appear in the stories bar, ordered: your avatar first (if you have a story), then unseen stories, then seen stories. You can like, reply, report or delete stories. Story viewers show who viewed or liked your story.' },
  { q: 'How do posts work?', a: 'On the Feed you can create posts (text, image, video or combinations). Post owners can edit or delete their posts. Any visible post can be liked, commented on, reported, shared, or saved (if allowed).' },
  { q: 'How does a private account behave?', a: 'If an account is private: non-followers cannot view posts, stories, followers/following lists or highlights. Attempting a direct route to private content redirects back to the profile with a message that the account is private.' },
  { q: 'What are follow requests?', a: 'If an account is private and someone requests to follow you, the request appears under Connections > Requests where you can accept or reject it.' },
  { q: 'How does search work?', a: 'The search requires at least 2 characters. Results are grouped (Top, Posts, People). Recent searches are saved to localStorage for quick access.' },
  { q: 'How do messages work?', a: 'Messages are real-time and secure. You can send text, images, video, voice, or files. You can edit or delete your messages and reply to messages. Typing indicators and read status are supported.' },
  { q: 'How do notifications work?', a: 'Notifications include likes, comments, replies, follow events and follow request updates. You can open the notifications dropdown from the header.' },
];

export default function HelpPage() {
  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />

      <div className={styles.help}>
        {/* Hero */}
        <header className={styles.help__hero}>
          <h1 className={styles.help__title}>LinkUp Help Center</h1>
          <p className={styles.help__subtitle}>
            Find quick answers about using LinkUp – from creating stories to managing your privacy.
          </p>
        </header>

        {/* Navigation */}
        <nav aria-label="Help sections" className={styles.help__nav}>
          <ul className={styles.help__navList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className={styles.help__navLink}>
                  {section.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className={styles.help__navLink}>
                FAQ
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className={styles.help__content}>
        {sections.map((section) => (
        <section key={section.id} id={section.id} className={styles.help__section}>
            <h2 className={styles.help__sectionTitle}>{section.title}</h2>

            {section.cards ? (
            <div className={styles.help__grid}>
                {section.cards.map((card, idx) => (
                <div key={idx} className={styles.help__card}>
                    <h3 className={styles.help__cardTitle}>{card.title}</h3>

                    {/* Steps */}
                    {card.steps && (
                    <ol className={styles.help__list}>
                        {card.steps.map((step, i) => (
                        <li key={i} className={styles.help__listItem}>
                            <span className={styles.help__bullet} />
                            {step}
                        </li>
                        ))}
                    </ol>
                    )}
                </div>
                ))}
            </div>
            ) : (
            <div className={styles.help__card}>
                <p className={styles.help__text}>{section.content}</p>

                {section.list && (
                <ul className={styles.help__list}>
                    {section.list.map((item, i) => (
                    <li key={i} className={styles.help__listItem}>
                        <span className={styles.help__bullet} />
                        {item}
                    </li>
                    ))}
                </ul>
                )}

                {section.link && (
                <p className={styles.help__text}>
                    For details on data collection and your rights, see our{' '}
                    <Link href={section.link.href} className={styles.help__link}>
                    {section.link.text}
                    </Link>
                    .
                </p>
                )}

                {section.actions && (
                <p className={styles.help__text + ' ' + styles.help__actions}>
                    {section.actions}
                </p>
                )}
            </div>
            )}
        </section>
        ))}


          {/* FAQ */}
          <section id="faq" className={styles.help__section}>
            <h2 className={styles.help__sectionTitle}>Frequently Asked Questions</h2>

            <div className={styles.help__faq}>
              {faq.map((item, idx) => (
                <details key={idx} className={styles.help__faqItem} open={idx < 2}>
                  <summary className={styles.help__faqQuestion}>
                    {item.q}
                  </summary>
                  <div className={styles.help__faqAnswer}>
                    <p className={styles.help__text}>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* Support CTA */}
        <footer className={styles.help__footer}>
        <h2 className={styles.help__footerTitle}>Need help?</h2>
        <p className={styles.help__footerText}>
            Contact our support team for any questions or issues.
        </p>
        <a href="mailto:support@linkup.com" className={styles.help__footerButton}>
            Contact Support
        </a>
        </footer>
      </div>
    </>
  );
}