'use client'

import { LandingSection, MotionBlock } from './LandingMotion'

const STATS = [
  { label: 'Commandes livrées', value: '10 000+' },
  { label: 'Clients satisfaits', value: '95 %' },
  { label: 'Délai moyen', value: '< 45 min' },
  { label: 'Plats au menu', value: '+50 recettes maison' },
]

export default function LandingStats() {
  return (
    <LandingSection className="landing-modern-section landing-modern-stats">
      <div className="landing-modern-container">
        <div className="landing-modern-stats__grid">
          {STATS.map((stat) => (
            <MotionBlock key={stat.label} className="landing-modern-stat-card">
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </MotionBlock>
          ))}
        </div>
      </div>
    </LandingSection>
  )
}
