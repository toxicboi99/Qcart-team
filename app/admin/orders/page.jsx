'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/admin/Footer";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";

const Orders = () => {

    const { currency } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchAdminOrders();
    }, []);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                {!isBackendAvailable && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Backend server is not available. Showing demo data. 
                            Please start the backend server at <code className="bg-yellow-100 px-1 rounded">http://localhost:5000</code>
                        </p>
                    </div>
                )}
                <h2 className="text-lg font-medium">All Orders</h2>
                <div className="max-w-4xl rounded-md">
                    {orders.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No orders found
                        </div>
                    ) : (
                        orders.map((order, index) => (
                            <div key={order._id || index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium">
                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                        </span>
                                        <span>Items : {order.items.length}</span>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span >{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                                        <br />
                                        <span>{order.address.phoneNumber}</span>
                                    </p>
                                </div>
                                <p className="font-medium my-auto">{currency}{order.amount}</p>
                                <div>
                                    <p className="flex flex-col">
                                        <span>Method : {order.paymentMethod || 'COD'}</span>
                                        <span>Date : {new Date(order.date || order.createdAt).toLocaleDateString()}</span>
                                        <span className={`font-medium ${order.status === 'Completed' ? 'text-green-600' : order.status === 'Pending' ? 'text-orange-600' : 'text-gray-600'}`}>
                                            Status : {order.status || 'Pending'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;
