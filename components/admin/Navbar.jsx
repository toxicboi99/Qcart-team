'use client'
import React from 'react'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { clearAdminSession } from '@/lib/session'

const Navbar = () => {
  const router = useRouter()

  const handleLogout = () => {
    clearAdminSession()
    router.push('/admin/login')
  }

  return (
    <div className='flex items-center px-4 md:px-8 py-3 justify-between border-b'>
      <Image onClick={()=>router.push('/')} className='w-28 lg:w-32 cursor-pointer' src={assets.logo} alt="" />
      <button 
        onClick={handleLogout}
        className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-gray-700 transition'
      >
        Logout
      </button>
    </div>
  )
}

export default Navbar
