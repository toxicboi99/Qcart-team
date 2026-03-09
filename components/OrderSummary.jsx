import { addressDummyData } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {

  const { currency, router, getCartCount, getCartAmount, userData, cartItems, products, setCartItems } = useAppContext()
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = async () => {
    // Try to get addresses from localStorage first
    try {
      const savedAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
      if (savedAddresses.length > 0 && userData?._id) {
        // Filter addresses for current user
        const userAddresses = savedAddresses.filter(addr => addr.userId === userData._id);
        if (userAddresses.length > 0) {
          setUserAddresses(userAddresses);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
    // Fallback to dummy data
    setUserAddresses(addressDummyData);
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const createOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!userData || !userData._id) {
      toast.error('Please sign in to place an order');
      router.push('/signin?return=/cart');
      return;
    }

    // Prepare order items from cart
    const items = Object.keys(cartItems).map(itemId => {
      const product = products.find(p => p._id === itemId);
      if (!product || cartItems[itemId] <= 0) return null;
      
      return {
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          offerPrice: product.offerPrice,
          image: product.image,
          category: product.category
        },
        quantity: cartItems[itemId]
      };
    }).filter(item => item !== null);

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const subtotal = getCartAmount();
    const tax = Math.floor(subtotal * 0.02);
    const totalAmount = subtotal + tax;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          items: items,
          amount: totalAmount,
          address: {
            fullName: selectedAddress.fullName,
            phoneNumber: selectedAddress.phoneNumber,
            pincode: selectedAddress.pincode,
            area: selectedAddress.area,
            city: selectedAddress.city,
            state: selectedAddress.state
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Order placed successfully!');
        // Clear cart
        setCartItems({});
        localStorage.removeItem('cart');
        // Redirect to order placed page
        router.push('/order-placed');
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserAddresses();
  }, [userData])

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">{currency}{Math.floor(getCartAmount() * 0.02)}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{currency}{getCartAmount() + Math.floor(getCartAmount() * 0.02)}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={createOrder} 
        disabled={loading || !selectedAddress || getCartCount() === 0}
        className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
};

export default OrderSummary;
