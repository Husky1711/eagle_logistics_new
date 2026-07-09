import { Link } from 'react-router-dom'

const variants = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50',
}

export default function Button({
  children,
  variant = 'primary',
  to,
  href,
  type,
  className = '',
  ...props
}) {
  const classes = `${variants[variant] || variants.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type ?? 'button'} className={classes} {...props}>
      {children}
    </button>
  )
}
