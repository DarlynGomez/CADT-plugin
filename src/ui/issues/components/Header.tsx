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
 * GROUPING_SPEC.md 6.1: wordmark, a quiet live indicator, the Live Watch and Teach Me
 * Why tabs, the computed headline (Live Watch only), no footer. The trailing empty
 * slot is reserved for the markers toggle MARKERS_SPEC.md 6.3 adds in phase 24,
 * deliberately not built ahead of that phase.
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
