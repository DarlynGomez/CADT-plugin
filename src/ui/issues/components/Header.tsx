import { BookOpen } from "lucide-react";

import type { Headline } from "../../../shared/grouping/headline";
import { formatHeadline, openCountFromHeadline } from "../headlineText";
import styles from "./Header.module.css";

export type MainTab = "live-watch" | "teach-me-why";

interface HeaderProps {
  headline: Headline;
  activeMainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
}

/**
 * Wordmark, live dot, tabs and the computed headline, no footer
 * The empty slot at the end is reserved for the markers toggle
 */
export function Header({ headline, activeMainTab, onMainTabChange }: HeaderProps) {
  const isLiveWatch = activeMainTab === "live-watch";

  return (
    <header className={styles.header}>
      {/* <div className={styles.topRow}>
        <span className={styles.wordmark}>CADT</span>
        <span className={styles.liveIndicator} aria-hidden="true" />
        <span className={styles.markerSlot} />
      </div> */}
      <div className={styles.tabRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isLiveWatch}
          className={`${styles.tab} ${isLiveWatch ? styles.tabActive : ""}`}
          onClick={() => onMainTabChange("live-watch")}
        >
          Live Watch
          <span className={`${styles.countPill} ${isLiveWatch ? styles.countPillActive : ""}`}>
            {openCountFromHeadline(headline)}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isLiveWatch}
          className={`${styles.tab} ${!isLiveWatch ? styles.tabActive : ""}`}
          onClick={() => onMainTabChange("teach-me-why")}
        >
          <BookOpen size={14} aria-hidden="true" />
          <span>Teach Me Why</span>
        </button>
      </div>
      {isLiveWatch && <p className={styles.headline}>{formatHeadline(headline)}</p>}
    </header>
  );
}
