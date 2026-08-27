'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

const sources = {
  icon: '/logo.png',
  wide: '/logo-wide.png',
}

export default function Logo({ size = 48, variant = 'icon', animated = false, className = '' }) {
  const src = sources[variant] || sources.icon
  const width = variant === 'wide' ? Math.round(size * 3.2) : size
  const height = size

  const content = (
    <Image
      src={src}
      alt="ZomiDev"
      width={width}
      height={height}
      priority
      sizes={variant === 'wide' ? `${width}px` : `${size}px`}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxHeight: height, width: 'auto' }}
    />
  )

  if (!animated) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  )
}
