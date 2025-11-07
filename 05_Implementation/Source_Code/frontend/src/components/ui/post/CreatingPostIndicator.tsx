import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";

/**
 * Visual indicator shown while a new post is being created/uploaded.
 * Provides accessibility support with proper ARIA attributes.
 */
const CreatingPostIndicator: React.FC = () => {
  return (
    <div
      className={styles.feed__creating_post}
      role="status"
      aria-live="polite"
      aria-label="Creating your post"
    >
      <div className={styles.feed__creating_post_spinner} />
      <span className={styles.feed__creating_post_text}>
        Creating your post...
      </span>
    </div>
  );
};

export default CreatingPostIndicator;