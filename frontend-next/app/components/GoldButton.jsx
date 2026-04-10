"use client"
import Link from 'next/link'

export default function GoldButton({children, onClick, className='', type='button', disabled=false, href}){
  const base = `gold ${className}`.trim()
  if(href){
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>{children}</button>
  )
}
