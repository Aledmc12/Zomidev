import Link from 'next/link'

const variants = {
  primary: 'bg-gold text-bg hover:bg-gold-soft',
  secondary: 'border border-gold/40 text-gold-soft hover:border-gold hover:bg-gold/10',
  ghost: 'text-bone hover:text-gold-soft',
}

export default function Button({ href, children, variant = 'primary', className = '', ...props }) {
  const classes = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium tracking-wide transition duration-300 ${variants[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
