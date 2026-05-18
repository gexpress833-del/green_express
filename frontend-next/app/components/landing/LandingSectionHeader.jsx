'use client'

import { MotionBlock } from './LandingMotion'

export default function LandingSectionHeader({ title, description, align = 'center' }) {
  return (
    <MotionBlock className={`landing-section-header landing-section-header--${align}`}>
      <h2 className="landing-section-title">{title}</h2>
      {description ? <p className="landing-section-desc">{description}</p> : null}
    </MotionBlock>
  )
}
