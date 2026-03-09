"use client"
import React, { useState } from "react";
import { assets} from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";

const Navbar = () => {

  const { isAdmin, router, isAuthenticated, userData, logout, getCartCount } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const cartCount = getCartCount();

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push('/')}
        src={assets.logo}
        alt="logo"
      />
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/about" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/contact" className="hover:text-gray-900 transition">
          Contact
        </Link>

        <Link href="/admin" className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-50 transition">Admin</Link>

      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <Image className="w-4 h-4 cursor-pointer" src={assets.search_icon} alt="search icon" />
        
        {/* Cart Icon */}
        <div className="relative cursor-pointer" onClick={() => router.push('/cart')}>
          <Image src={assets.cart_icon} alt="cart icon" className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>

        {/* Authentication Buttons */}
        {!isAuthenticated ? (
          <>
            <Link href="/signin">
              <button className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition">
                Sign Up
              </button>
            </Link>
          </>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:text-gray-900 transition"
            >
              <Image src={assets.user_icon} alt="user icon" />
              <span className="text-sm">{userData?.name || 'Account'}</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Link href="/my-orders" onClick={() => setShowDropdown(false)}>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    My Orders
                  </div>
                </Link>
                <div 
                  onClick={() => { logout(); setShowDropdown(false); }}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-red-600"
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </ul>

      {/* Mobile Menu */}
      <div className="flex items-center md:hidden gap-3">
        {/* Cart Icon Mobile */}
        <div className="relative cursor-pointer" onClick={() => router.push('/cart')}>
          <Image src={assets.cart_icon} alt="cart icon" className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>

        {isAdmin && <button onClick={() => router.push('/admin')} className="text-xs border px-3 py-1 rounded-full">Admin</button>}

        {!isAuthenticated ? (
          <>
            <Link href="/signin">
              <button className="px-3 py-1 text-xs border border-gray-300 rounded">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-3 py-1 text-xs bg-orange-600 text-white rounded">
                Sign Up
              </button>
            </Link>
          </>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1"
            >
              <Image src={assets.user_icon} alt="user icon" className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-3 py-2 text-xs border-b border-gray-200">
                  {userData?.name}
                </div>
                <Link href="/my-orders" onClick={() => setShowDropdown(false)}>
                  <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs">
                    My Orders
                  </div>
                </Link>
                <div 
                  onClick={() => { logout(); setShowDropdown(false); }}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs text-red-600"
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;