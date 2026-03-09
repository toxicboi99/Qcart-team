'use client'

import Navbar from '@/components/admin/Navbar'
import Sidebar from '@/components/admin/Sidebar'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAdminSession, isSessionValid, clearAdminSession, SESSION_CHECK_INTERVAL_MS } from '@/lib/session'

const Layout = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  const isLoginPage = pathname?.includes('/admin/login')

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true)
      return
    }
    const session = getAdminSession()
    if (!session || !isSessionValid(session)) {
      if (session) clearAdminSession()
      router.replace('/admin/login')
      return
    }
    setChecked(true)
  }, [pathname, isLoginPage, router])

  // Session expiry check - redirect to login when admin session expires
  useEffect(() => {
    if (isLoginPage || !checked) return
    const interval = setInterval(() => {
      const session = getAdminSession()
      if (!session || !isSessionValid(session)) {
        if (session) clearAdminSession()
        router.replace('/admin/login')
      }
    }, SESSION_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isLoginPage, checked, router])

  // Login page - no Navbar/Sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  // Dashboard - wait for auth check, then show layout
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        <Sidebar />
        {children}
      </div>
    </div>
  )
}

export default Layout
