'use client'

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAppContext();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirect to home page or previous page
      const returnUrl = new URLSearchParams(window.location.search).get('return');
      router.push(returnUrl || '/');
    }
    
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-6 md:px-16 lg:px-32 py-16">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Image
              className="w-28 md:w-32"
              src={assets.logo}
              alt="logo"
            />
          </div>
          <p className="text-2xl md:text-3xl text-gray-500 text-center mb-2">
            Welcome <span className="font-medium text-orange-600">back</span>
          </p>
          <p className="text-sm text-gray-500/80 text-center mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={loading}
            />
            <input
              className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loading}
            />
            <div className="flex justify-end">
              <Link
                href="#"
                className="text-xs text-orange-600 hover:text-orange-700 transition"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 hover:bg-orange-700 transition uppercase font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-orange-600 font-medium hover:text-orange-700 transition"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignIn;
