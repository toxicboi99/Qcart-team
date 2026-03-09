'use client'

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import toast from "react-hot-toast";

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup"); // "signup" or "verify"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (step === "signup") {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setMessage("Passwords do not match");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.fullName,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("OTP sent to your email address!");
          setMessage("OTP sent to your email address. Please check your inbox and verify.");
          setStep("verify");
        } else {
          toast.error(data.error || "Signup failed");
          setMessage(data.error || "Signup failed");
        }
      } catch (error) {
        toast.error("Failed to connect to server. Please try again.");
        setMessage("Failed to connect to server. Please try again.");
        console.error("Signup error:", error);
      }
    } else {
      // Verify OTP
      try {
        const response = await fetch("http://localhost:5000/api/users/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            otp: otp,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Account created successfully!");
          setMessage("Account created successfully! Redirecting to sign in...");
          setTimeout(() => {
            window.location.href = "/signin";
          }, 2000);
        } else {
          toast.error(data.error || "OTP verification failed");
          setMessage(data.error || "OTP verification failed");
        }
      } catch (error) {
        toast.error("Failed to verify OTP. Please try again.");
        setMessage("Failed to verify OTP. Please try again.");
        console.error("Verify error:", error);
      }
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
            Create <span className="font-medium text-orange-600">account</span>
          </p>
          <p className="text-sm text-gray-500/80 text-center mb-8">
            Sign up to get started with QuickCart
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "signup" ? (
              <>
                <input
                  className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                  type="text"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  disabled={loading}
                />
                <input
                  className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                  type="tel"
                  placeholder="Phone Number (with country code)"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value.replace(/[^0-9]/g, '') })
                  }
                  required
                  disabled={loading}
                  pattern="[0-9]{10,}"
                  title="Enter phone number with country code (digits only, minimum 10 digits)"
                />
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
                <input
                  className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={loading}
                />
                {message && (
                  <p className={`text-sm ${message.includes("OTP sent") ? "text-green-600" : "text-red-600"}`}>
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-3 hover:bg-orange-700 transition uppercase font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending OTP..." : "Sign up"}
                </button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                  <p className="text-sm text-green-800">
                    OTP has been sent to your email address. Please check your inbox (and spam folder) and enter the 6-digit code below.
                  </p>
                </div>
                <input
                  className="px-3 py-3 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500 text-center text-2xl tracking-widest"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  required
                  disabled={loading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                {message && (
                  <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-3 hover:bg-orange-700 transition uppercase font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("signup");
                    setOtp("");
                    setMessage("");
                  }}
                  className="w-full text-orange-600 py-2 hover:text-orange-700 transition text-sm"
                >
                  Back to signup
                </button>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-orange-600 font-medium hover:text-orange-700 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUp;
