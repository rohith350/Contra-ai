export * from './sphere'
export * from './investigation'

import type { ReactNode } from 'react'

export interface BaseLayoutProps {
  children: ReactNode
}

export interface NavigationLink {
  label: string
  href: string
  icon?: string
}

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}
