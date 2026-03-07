import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import api from '@/lib/axios'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ unread_count?: number; count?: number }>('/notifications/unread_count/'),
    refetchInterval: 30_000,
  })

  const unreadCount = unreadData?.data?.unread_count ?? unreadData?.data?.count ?? 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar
        unreadCount={unreadCount}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar unreadCount={unreadCount} isMobile={isMobile} onMenuToggle={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          style={{
            flex: 1,
            padding: isMobile ? 'var(--space-4)' : 'var(--space-8)',
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
