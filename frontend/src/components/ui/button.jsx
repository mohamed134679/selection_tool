import React from 'react'
import { cn } from '../../lib/utils'

function Button({ className, children, variant, size, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium'
  return (
    <button className={cn(base, className)} {...props}>
      {children}
    </button>
  )
}

export { Button }