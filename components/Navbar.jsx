"use client"
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";

const Navbar = () => {
  const { isAdmin, router, isAuthenticated, userData, logout, getCartCount } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = getCartCount();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/all-products", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700 bg-white sticky top-0 z-40">
      <Image
        className="cursor-pointer w-24 sm:w-28 md:w-32 shrink-0"
        onClick={() => { router.push("/"); closeMobileMenu(); }}
        src={assets.logo}
        alt="logo"
      />

      {/* Desktop nav links */}
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        {navLinks.map(({ href, label }) => (
          <Link key={href} href={href} className="hover:text-gray-900 transition">
            {label}
          </Link>
        ))}
        <Link href="/admin" className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-50 transition">
          Admin
        </Link>
      </div>

      {/* Desktop right section: search, cart, auth */}
      <ul className="hidden md:flex items-center gap-4">
        <Image className="w-4 h-4 cursor-pointer" src={assets.search_icon} alt="search icon" />
        <div className="relative cursor-pointer" onClick={() => router.push("/cart")}>
          <Image src={assets.cart_icon} alt="cart icon" className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
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
              <span className="text-sm">{userData?.name || "Account"}</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Link href="/my-orders" onClick={() => setShowDropdown(false)}>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    My Orders
                  </div>
                </Link>
                <div
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-red-600"
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </ul>

      {/* Mobile: cart + auth + hamburger */}
      <div className="flex md:hidden items-center gap-2 sm:gap-3">
        <div className="relative cursor-pointer p-1" onClick={() => router.push("/cart")} aria-label="Cart">
          <Image src={assets.cart_icon} alt="cart icon" className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </div>

        {!isAuthenticated ? (
          <>
            <Link href="/signin">
              <button className="px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition touch-manipulation">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-2.5 py-1.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition touch-manipulation">
                Sign Up
              </button>
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 p-1 touch-manipulation"
              aria-label="Account menu"
            >
              <Image src={assets.user_icon} alt="user icon" className="w-5 h-5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-3 py-2 text-xs border-b border-gray-200 truncate">
                  {userData?.name}
                </div>
                <Link href="/my-orders" onClick={() => setShowDropdown(false)}>
                  <div className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm active:bg-gray-100">
                    My Orders
                  </div>
                </Link>
                <div
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-red-600 active:bg-red-50"
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 touch-manipulation"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu overlay + panel */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? "visible" : "invisible"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobileMenu}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-[280px] bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <span className="font-medium text-gray-800">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;