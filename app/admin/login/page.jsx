'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { createSession, setAdminSession } from '@/lib/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/users/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        const session = createSession(data.user)
        setAdminSession(session)
        toast.success('Admin login successful')
        router.push('/admin')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch {
      toast.error('Failed to connect to server')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <Image src={assets.logo} alt="QuickCart" width={120} height={120} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Admin Login</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Enter your admin credentials</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <a href="/" className="block text-center text-sm text-orange-600 hover:text-orange-700 mt-6">
          ← Back to Store
        </a>
      </div>
    </div>
  )
}

export default AdminLogin
