'use client'

import styles from './admin-shell.module.css'

/**
 * Enveloppe visuelle pour toutes les routes /admin (fond, halos, grille — cohérent avec l’écran entreprise en attente).
 */
export default function AdminShell({ children }) {
  return (
    <div className={`${styles.shell} ${styles.shellTightTop}`}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.gridFloor} aria-hidden />
      <div className={styles.shellContent}>{children}</div>
    </div>
  )
}
