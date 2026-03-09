'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

const faqs = [
  { q: 'How do I place an order?', a: 'Sign in, add items to your cart, select a delivery address, and click Place Order.' },
  { q: 'How can I track my order?', a: 'Go to My Orders from your account dropdown. You\'ll see all orders with their current status (Pending, Processing, Completed).' },
  { q: 'How do I update my address?', a: 'Go to the Cart page and add a new address before placing an order. Your addresses are saved for future orders.' },
  { q: 'How does email verification work?', a: 'When you sign up, we send an OTP to your email address. Enter it on the verification page to activate your account.' },
  { q: 'Can I cancel my order?', a: 'Contact our support team. Orders in Pending or Processing status may be cancellable.' },
  { q: 'What payment methods do you accept?', a: 'Currently we support Cash on Delivery (COD). More payment options coming soon!' }
]

const HelpPage = () => {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-gray-500 mb-12">
            Find answers to common questions. Can&apos;t find what you need?{' '}
            <Link href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
              Contact us
            </Link>
          </p>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-teal-50 rounded-xl border border-teal-100">
            <h2 className="font-semibold text-gray-900 mb-2">Still need help?</h2>
            <p className="text-gray-600 text-sm mb-4">Our support team is here for you.</p>
            <Link href="/contact" className="inline-block py-2 px-5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition font-medium">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default HelpPage
