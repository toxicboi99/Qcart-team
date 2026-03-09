'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import Link from 'next/link'

const AboutPage = () => {
  const values = [
  { title: 'Customer First', desc: 'We prioritize your experience and satisfaction in every decision we make.' },
  { title: 'Quality Products', desc: 'Carefully curated selection of products you can trust.' },
  { title: 'Fast Delivery', desc: 'Quick and reliable delivery to your doorstep.' },
  { title: 'Easy Support', desc: 'Helpful support and clear email notifications when you need us.' }
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 py-16 md:py-24 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl -mr-48 -mt-24" />
          <div className="relative max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  About QuickCart
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  QuickCart is your trusted eCommerce platform for quality products at great prices. 
                  We combine modern technology with a focus on customer experience to make shopping simple and enjoyable.
                </p>
                <p className="text-gray-600 mb-8">
                  Founded with a mission to bring convenience to online shopping, we focus on clear communication 
                  and helpful email notifications for important updates. From signup to delivery, we stay connected with you every step of the way.
                </p>
                <Link href="/all-products" className="inline-block px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition">
                  Shop Now
                </Link>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                  <Image src={assets.logo} alt="QuickCart" fill className="object-contain p-8 bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
              What We Stand For
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((v, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <span className="text-orange-600 font-bold">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-orange-600 py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-32">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <div className="text-2xl md:text-3xl font-bold">1000+</div>
                <div className="text-orange-100 text-sm mt-1">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">500+</div>
                <div className="text-orange-100 text-sm mt-1">Products</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">24/7</div>
                <div className="text-orange-100 text-sm mt-1">Customer Support</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">Fast</div>
                <div className="text-orange-100 text-sm mt-1">Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of satisfied customers. Sign up today and get important updates via email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition">
                Create Account
              </Link>
              <Link href="/contact" className="px-6 py-3 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default AboutPage
