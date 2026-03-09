'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [salesForm, setSalesForm] = useState({ name: '', email: '', phoneNumber: '', message: '', company: '' })
  const [loading, setLoading] = useState(false)

  const handleSalesSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales',
          name: salesForm.name,
          email: salesForm.email,
          phoneNumber: salesForm.phoneNumber,
          message: salesForm.company ? `${salesForm.message}\nCompany: ${salesForm.company}` : salesForm.message
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Thank you! Our sales team will contact you soon.')
        setShowSalesModal(false)
        setSalesForm({ name: '', email: '', phoneNumber: '', message: '', company: '' })
      } else {
        toast.error(data.error || 'Failed to submit')
      }
    } catch {
      toast.error('Failed to submit. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        {/* Decorative blurred background - vintage phone style */}
        <div className="absolute top-0 right-0 w-96 h-96 -mr-32 -mt-32 bg-gradient-to-br from-orange-200/40 to-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-64 h-64 bg-orange-100/50 rounded-full blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 md:mb-16">
            Contact us
          </h1>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {/* Sales Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center mb-6">
                <svg className="w-9 h-9 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                  <path d="M19 10v1c0 2.76-2.24 5-5 5h-4c-2.76 0-5-2.24-5-5v-1h2v1c0 1.65 1.35 3 3 3h4c1.65 0 3-1.35 3-3v-1h2z"/>
                  <path d="M12 18a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"/>
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                Talk to a member of our Sales team
              </h2>
              <p className="text-gray-500 text-sm md:text-base mb-6">
                We&apos;ll help you find the right products and pricing for your business.
              </p>
              <button
                onClick={() => setShowSalesModal(true)}
                className="w-full max-w-xs py-3 px-6 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium transition"
              >
                Contact Sales
              </button>
            </div>

            {/* Support Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-pink-400 flex items-center justify-center mb-6">
                <svg className="w-9 h-9 text-pink-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                Product and account support
              </h2>
              <p className="text-gray-500 text-sm md:text-base mb-6">
                Our help center is fresh and always open for business. If you can&apos;t find the answer you&apos;re looking for, we&apos;re here to lend a hand.
              </p>
              <Link
                href="/help"
                className="w-full max-w-xs py-3 px-6 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium transition text-center block"
              >
                Go to the help center
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Contact Modal */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Sales</h3>
            <form onSubmit={handleSalesSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your name *"
                required
                value={salesForm.name}
                onChange={(e) => setSalesForm({ ...salesForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={salesForm.email}
                onChange={(e) => setSalesForm({ ...salesForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={salesForm.phoneNumber}
                onChange={(e) => setSalesForm({ ...salesForm, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={salesForm.company}
                onChange={(e) => setSalesForm({ ...salesForm, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
              <textarea
                placeholder="How can we help?"
                rows={4}
                value={salesForm.message}
                onChange={(e) => setSalesForm({ ...salesForm, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSalesModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default ContactPage
