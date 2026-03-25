import { addressDummyData } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PAYMENT_QR_URL = process.env.NEXT_PUBLIC_PAYMENT_QR_URL || "/payment-qr.svg";

const PAYMENT_METHODS = ["PhonePe", "Google Pay", "Paytm", "COD"];

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    userData,
    cartItems,
    products,
    setCartItems,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("PhonePe");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState("");

  const cartOrderItems = useMemo(
    () =>
      Object.keys(cartItems)
        .map((itemId) => {
          const product = products.find((entry) => entry._id === itemId);

          if (!product || cartItems[itemId] <= 0) {
            return null;
          }

          return {
            product: {
              _id: product._id,
              name: product.name,
              description: product.description,
              price: product.price,
              offerPrice: product.offerPrice,
              image: product.image,
              category: product.category,
            },
            quantity: cartItems[itemId],
          };
        })
        .filter(Boolean),
    [cartItems, products]
  );

  const subtotal = getCartAmount();
  const tax = Math.floor(subtotal * 0.02);
  const totalAmount = subtotal + tax;
  const requiresScreenshot = paymentMethod !== "COD";

  const fetchUserAddresses = async () => {
    try {
      const savedAddresses = JSON.parse(
        localStorage.getItem("userAddresses") || "[]"
      );

      if (savedAddresses.length > 0 && userData?._id) {
        const nextAddresses = savedAddresses.filter(
          (address) => address.userId === userData._id
        );

        if (nextAddresses.length > 0) {
          setUserAddresses(nextAddresses);
          setSelectedAddress(nextAddresses[0]);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }

    setUserAddresses(addressDummyData);
    setSelectedAddress(addressDummyData[0] || null);
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPaymentScreenshot(null);
      setPaymentPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setPaymentScreenshot(file);
    setPaymentPreviewUrl(URL.createObjectURL(file));
  };

  const createOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!userData || !userData._id) {
      toast.error("Please sign in to place an order");
      router.push("/signin?return=/cart");
      return;
    }

    if (cartOrderItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (requiresScreenshot && !paymentScreenshot) {
      toast.error("Please upload your payment screenshot");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("userId", userData._id);
      formData.set("items", JSON.stringify(cartOrderItems));
      formData.set("amount", String(totalAmount));
      formData.set(
        "address",
        JSON.stringify({
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber,
          pincode: selectedAddress.pincode,
          area: selectedAddress.area,
          city: selectedAddress.city,
          state: selectedAddress.state,
        })
      );
      formData.set("paymentMethod", paymentMethod);
      formData.set(
        "paymentStatus",
        requiresScreenshot ? "Verification Pending" : "Pending"
      );

      if (paymentScreenshot) {
        formData.set("paymentScreenshot", paymentScreenshot);
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Order placed successfully!");
        setCartItems({});
        localStorage.removeItem("cart");
        router.push("/order-placed");
      } else {
        toast.error(data.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, [userData]);

  useEffect(() => {
    if (!requiresScreenshot) {
      setPaymentScreenshot(null);
      setPaymentPreviewUrl("");
    }
  }, [requiresScreenshot]);

  useEffect(() => {
    return () => {
      if (paymentPreviewUrl) {
        URL.revokeObjectURL(paymentPreviewUrl);
      }
    };
  }, [paymentPreviewUrl]);

  return (
    <div className="w-full max-w-[460px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">
            Checkout
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Complete your order
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {["Address", "Payment", "Confirm"].map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  index === 0
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && <div className="h-px w-8 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Select Address
            </h3>
            <button
              onClick={() => router.push("/add-address")}
              className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              + Add New Address
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {userAddresses.map((address, index) => {
              const isSelected =
                selectedAddress &&
                [
                  selectedAddress.fullName,
                  selectedAddress.phoneNumber,
                  selectedAddress.area,
                  selectedAddress.city,
                  selectedAddress.state,
                  selectedAddress.pincode,
                ].join("|") ===
                  [
                    address.fullName,
                    address.phoneNumber,
                    address.area,
                    address.city,
                    address.state,
                    address.pincode,
                  ].join("|");

              return (
                <button
                  key={`${address.userId || "address"}-${index}`}
                  type="button"
                  onClick={() => setSelectedAddress(address)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-4 w-4 rounded-full border ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 shadow-[inset_0_0_0_4px_white]"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {address.fullName}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {address.area}, {address.city}, {address.state} -{" "}
                        {address.pincode}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Phone: {address.phoneNumber}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Payment Method
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_METHODS.map((method) => {
              const isActive = paymentMethod === method;

              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl border px-3 py-3 text-xs font-semibold transition ${
                    isActive
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>

          {requiresScreenshot ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="rounded-3xl bg-slate-100 p-3">
                  <img
                    src={PAYMENT_QR_URL}
                    alt="Payment QR code"
                    className="h-44 w-44 rounded-2xl object-cover"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Scan and pay {currency}
                    {totalAmount}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use {paymentMethod} to complete the payment, then upload the
                    payment screenshot so the order can be verified quickly.
                  </p>

                  <label className="mt-4 flex cursor-pointer flex-col rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-indigo-400 hover:bg-indigo-50/50">
                    <span className="text-sm font-medium text-slate-700">
                      Upload Payment Screenshot
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      PNG, JPG, or WEBP up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />
                    <span className="mt-3 inline-flex w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                      Choose File
                    </span>
                  </label>

                  {paymentPreviewUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <img
                        src={paymentPreviewUrl}
                        alt="Payment screenshot preview"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  {paymentScreenshot && (
                    <p className="mt-2 text-xs text-slate-500">
                      Selected: {paymentScreenshot.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Cash on Delivery is selected. No payment screenshot is required.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                Your Order
              </p>
              <p className="mt-2 text-lg font-semibold">
                {getCartCount()} items ready
              </p>
            </div>
            <p className="text-2xl font-semibold">
              {currency}
              {totalAmount}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {cartOrderItems.map((item) => (
              <div
                key={item.product._id}
                className="flex items-center gap-3 rounded-2xl bg-white/8 p-3"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={item.product.image?.[0] || "/payment-qr.svg"}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    {item.product.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {currency}
                    {item.product.offerPrice}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    x {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-white/70">
              <span>Items Total</span>
              <span>
                {currency}
                {subtotal}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/70">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between text-white/70">
              <span>Tax</span>
              <span>
                {currency}
                {tax}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>
                {currency}
                {totalAmount}
              </span>
            </div>
          </div>

          <button
            onClick={createOrder}
            disabled={loading || !selectedAddress || getCartCount() === 0}
            className="mt-5 w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default OrderSummary;
