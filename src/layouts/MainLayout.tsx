import type { BaseLayoutProps } from '../types'

export function MainLayout({ children }: BaseLayoutProps) {
  return (
    <div className="app-layout">
      <main className="app-content">{children}</main>
    </div>
  )
}
