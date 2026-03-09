'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/admin/Footer";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";

const OrderStatus = () => {

    const { currency } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Processing, Completed, Cancelled
    const [isBackendAvailable, setIsBackendAvailable] = useState(true);

    const fetchAdminOrders = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/orders/all', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
                setIsBackendAvailable(true);
            } else {
                // Fallback to dummy data
                console.warn('API returned error, using dummy data');
                setIsBackendAvailable(false);
                const { orderDummyData } = await import("@/assets/assets");
                setOrders(orderDummyData || []);
            }
        } catch (error) {
            console.warn('Backend server not available, using dummy data:', error.message);
            setIsBackendAvailable(false);
            // Fallback to dummy data when backend is not available
            try {
                const { orderDummyData } = await import("@/assets/assets");
                setOrders(orderDummyData || []);
            } catch (importError) {
                console.error('Failed to load dummy data:', importError);
                setOrders([]);
            }
        } finally {
            setLoading(false);
        }
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        if (!orderId) {
            toast.error('Invalid order ID');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                toast.success(`Order status updated to ${newStatus}`);
                // Update local state
                setOrders(orders.map(order => 
                    order._id === orderId 
                        ? { ...order, status: newStatus }
                        : order
                ));
            } else {
                try {
                    const data = await response.json();
                    toast.error(data.error || 'Failed to update order status');
                } catch (parseError) {
                    toast.error('Failed to update order status. Backend server may not be running.');
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            // Update local state even if API fails (for demo purposes)
            setOrders(orders.map(order => 
                order._id === orderId 
                    ? { ...order, status: newStatus }
                    : order
            ));
            toast.success(`Order status updated to ${newStatus} (local only - backend not available)`);
        }
    }

    useEffect(() => {
        fetchAdminOrders();
    }, []);

    const filteredOrders = filterStatus === 'All' 
        ? orders 
        : orders.filter(order => order.status === filterStatus);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Pending':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'Processing':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    }

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : (
                <div className="md:p-10 p-4 space-y-5">
                    {!isBackendAvailable && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Backend server is not available. Showing demo data. 
                                Status updates will work locally but won't be saved. 
                                Please start the backend server at <code className="bg-yellow-100 px-1 rounded">http://localhost:5000</code>
                            </p>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-lg font-medium">Order Status Management</h2>
                        
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                        filterStatus === status
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-w-6xl rounded-md">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                No orders found {filterStatus !== 'All' && `with status "${filterStatus}"`}
                            </div>
                        ) : (
                            filteredOrders.map((order, index) => (
                                <div key={order._id || index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300 hover:bg-gray-50 transition">
                                    <div className="flex-1 flex gap-5 max-w-80">
                                        <Image
                                            className="max-w-16 max-h-16 object-cover"
                                            src={assets.box_icon}
                                            alt="box_icon"
                                        />
                                        <div className="flex flex-col gap-2">
                                            <p className="font-medium">
                                                Order #{order._id?.slice(-6) || index + 1}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                            </p>
                                            <span className="text-xs">Items: {order.items.length}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="font-medium mb-1">Delivery Address</p>
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">{order.address.fullName}</span>
                                            <br />
                                            {order.address.area}
                                            <br />
                                            {`${order.address.city}, ${order.address.state}`}
                                            <br />
                                            {order.address.phoneNumber}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <p className="font-medium">{currency}{order.amount}</p>
                                        <p className="text-xs text-gray-600">
                                            Method: {order.paymentMethod || 'COD'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Date: {new Date(order.date || order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 min-w-[200px]">
                                        {/* Current Status */}
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Current Status</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status || 'Pending')}`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>

                                        {/* Status Update Buttons */}
                                        <div className="flex flex-col gap-2">
                                            {order.status !== 'Pending' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'Pending')}
                                                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition"
                                                >
                                                    Mark as Pending
                                                </button>
                                            )}
                                            {order.status !== 'Processing' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'Processing')}
                                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition"
                                                >
                                                    Mark as Processing
                                                </button>
                                            )}
                                            {order.status !== 'Completed' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'Completed')}
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition"
                                                >
                                                    Mark as Completed
                                                </button>
                                            )}
                                            {order.status !== 'Cancelled' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default OrderStatus;
