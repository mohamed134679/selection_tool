import React from 'react'
import { cn } from '../../lib/utils'

function Button({ className, children, variant, size, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition'
  const variants = {
    default: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border border-green-600 text-green-600 bg-white hover:bg-green-50',
  }
  const variantClass = variants[variant] || variants.default
  return (
    <button className={cn(base, variantClass, className)} {...props}>
      {children}
    </button>
  )
}

export { Button }