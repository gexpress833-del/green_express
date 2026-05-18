import fs from 'fs'

const p = new URL('../app/components/landing/LandingHero.jsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8')

s = s.replace(
  '<motion.div className="landing-inner landing-modern-hero__inner">',
  '<motion.div className="landing-inner landing-modern-hero__inner">'.replaceAll('motion.', ''),
)

fs.writeFileSync(p, s)
console.log('patched', p.pathname)
