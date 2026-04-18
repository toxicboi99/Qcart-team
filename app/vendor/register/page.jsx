'use client';

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import API_URL from "@/lib/api";

const CATEGORY_OPTIONS = [
  "electronics",
  "fashion",
  "grocery",
  "beauty",
  "home",
  "sports",
  "books",
  "toys",
  "health",
  "automotive",
  "accessories",
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  storeName: "",
  businessType: "individual",
  description: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  country: "Nepal",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  esewaId: "",
  fonepayId: "",
  panNumber: "",
  citizenshipNumber: "",
  categories: [],
  termsAccepted: false,
  commissionAccepted: false,
};

export default function VendorRegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register");
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleCategory = (category) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((entry) => entry !== category)
        : [...current.categories, category],
    }));
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const body = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          body.append(key, value.join(","));
          return;
        }

        if (typeof value === "boolean") {
          body.append(key, String(value));
          return;
        }

        body.append(key, value);
      });

      if (logo) {
        body.append("logo", logo);
      }

      if (banner) {
        body.append("banner", banner);
      }

      const response = await fetch(`${API_URL}/api/vendors/register`, {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vendor registration failed.");
      }

      toast.success("Vendor application submitted. Verify your OTP to continue.");
      setStep("otp");
    } catch (error) {
      toast.error(error.message || "Vendor registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          otp,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed.");
      }

      toast.success("Vendor account created. Sign in while admin approval is pending.");
      window.location.href = "/signin?return=/vendor/dashboard";
    } catch (error) {
      toast.error(error.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-[linear-gradient(180deg,#fff7ed_0%,#f8fafc_42%,#ffffff_100%)] px-6 py-16 md:px-16 lg:px-24">
        <div className="mx-auto max-w-4xl">

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] md:p-8">

{step === "register" ? (

<form onSubmit={submitRegistration} className="space-y-10">

  {/* HEADER */}
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
      Vendor Registration
    </p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">
      Build your seller account
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Fill all details to start selling
    </p>
  </div>

  {/* PERSONAL */}
  <div className="rounded-3xl border p-5">
    <h3 className="mb-4 font-semibold">👤 Personal Info</h3>

    <div className="grid gap-6 md:grid-cols-2">
      <label className="space-y-2">
        <span>Full name</span>
        <input value={form.fullName} onChange={(e)=>updateField("fullName",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>

      <label className="space-y-2">
        <span>Email</span>
        <input type="email" value={form.email} onChange={(e)=>updateField("email",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>

      <label className="space-y-2">
        <span>Phone</span>
        <input value={form.phone} onChange={(e)=>updateField("phone",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>

      <label className="space-y-2">
        <span>Password</span>
        <input type="password" value={form.password} onChange={(e)=>updateField("password",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>
    </div>
  </div>

  {/* STORE */}
  <div className="rounded-3xl border p-5">
    <h3 className="mb-4 font-semibold">🏪 Store Info</h3>

    <div className="grid gap-6 md:grid-cols-2">

      <label className="space-y-2 md:col-span-2">
        <span>Store name</span>
        <input value={form.storeName} onChange={(e)=>updateField("storeName",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>

      <label className="space-y-2">
        <span>Business type</span>
        <select value={form.businessType} onChange={(e)=>updateField("businessType",e.target.value)} className="w-full rounded-xl border px-4 py-3">
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
      </label>

      <label className="space-y-2">
        <span>Store logo</span>
        <input type="file" onChange={(e)=>setLogo(e.target.files?.[0] || null)} className="w-full"/>
      </label>

      <label className="space-y-2 md:col-span-2">
        <span>Store description</span>
        <textarea value={form.description} onChange={(e)=>updateField("description",e.target.value)} className="w-full rounded-xl border px-4 py-3"/>
      </label>

      <label className="space-y-2 md:col-span-2">
        <span>Store banner</span>
        <input type="file" onChange={(e)=>setBanner(e.target.files?.[0] || null)} className="w-full"/>
      </label>

    </div>
  </div>

  {/* ADDRESS */}
  <div className="rounded-3xl border p-5">
    <h3 className="mb-4 font-semibold">📍 Address</h3>

    <div className="grid gap-6 md:grid-cols-2">
      {["address1","address2","city","state","pincode","country"].map((key)=>(
        <input key={key} value={form[key]} onChange={(e)=>updateField(key,e.target.value)} placeholder={key} className="w-full rounded-xl border px-4 py-3"/>
      ))}
    </div>
  </div>

  {/* BANK */}
  <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
    <h3 className="mb-4 font-semibold">💳 Bank Details</h3>

    <div className="grid gap-6 md:grid-cols-2">
      {["accountHolderName","bankName","accountNumber","esewaId","fonepayId","panNumber"].map((key)=>(
        <input key={key} value={form[key]} onChange={(e)=>updateField(key,e.target.value)} placeholder={key} className="w-full rounded-xl border px-4 py-3"/>
      ))}

      <input value={form.citizenshipNumber} onChange={(e)=>updateField("citizenshipNumber",e.target.value)} placeholder="citizenshipNumber" className="w-full rounded-xl border px-4 py-3 md:col-span-2"/>
    </div>
  </div>

  {/* CATEGORY */}
  <div>
    <span>Store categories</span>
    <div className="flex flex-wrap gap-2 mt-2">
      {CATEGORY_OPTIONS.map((cat)=>(
        <button type="button" key={cat} onClick={()=>toggleCategory(cat)}
          className={`px-3 py-1 rounded-full ${form.categories.includes(cat) ? "bg-orange-500 text-white" : "bg-gray-200"}`}>
          {cat}
        </button>
      ))}
    </div>
  </div>

  {/* TERMS */}
  <div className="border p-4 rounded-xl space-y-2">
    <label className="flex gap-2">
      <input type="checkbox" checked={form.termsAccepted} onChange={(e)=>updateField("termsAccepted",e.target.checked)}/>
      Accept terms
    </label>

    <label className="flex gap-2">
      <input type="checkbox" checked={form.commissionAccepted} onChange={(e)=>updateField("commissionAccepted",e.target.checked)}/>
      Accept commission
    </label>
  </div>

  {/* SUBMIT */}
  <button className="w-full bg-orange-500 text-white py-4 rounded-xl">
    {loading ? "Submitting..." : "Submit Vendor Application"}
  </button>

</form>

) : (

<form onSubmit={verifyOtp} className="space-y-6">

  <h2 className="text-2xl font-semibold">OTP Verification</h2>

  <input
    value={otp}
    onChange={(e)=>setOtp(e.target.value)}
    className="w-full border px-4 py-4 text-center text-2xl rounded-xl"
  />

  <button className="w-full bg-black text-white py-3 rounded-xl">
    Verify OTP
  </button>

  <button type="button" onClick={()=>setStep("register")} className="w-full border py-3 rounded-xl">
    Back
  </button>

</form>

)}

</section>        </div>
      </div>
      <Footer />
    </>
  );
}
