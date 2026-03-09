'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";

const MyOrders = () => {

    const router = useRouter();

    const {
        currency,
        userData,
        isAuthenticated,
        authLoading
    } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);


    const fetchOrders = async () => {

        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/orders/user/${userData._id}`
                );

            if (response.ok) {

                const data = await response.json();

                setOrders(data);

            } else {

                setOrders(orderDummyData);

            }

        } catch (error) {

            setOrders(orderDummyData);

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        if (authLoading) return;

        if (!isAuthenticated) {

            router.push('/signin?return=/my-orders');

        } else {

            fetchOrders();

        }

    }, [authLoading, isAuthenticated]);


    // ✅ show loading properly
    if (authLoading || loading) {

        return (
            <>
                <Navbar />
                <Loading />
                <Footer />
            </>
        )

    }


    return (
        <>
            <Navbar />

            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">

                <div className="space-y-5">

                    <h2 className="text-lg font-medium mt-6">
                        My Orders
                    </h2>


                    {

                        orders.length === 0 ?

                            (
                                <div className="text-center py-10 text-gray-500">
                                    No orders found
                                </div>
                            )

                            :

                            (

                                <div className="max-w-5xl border-t border-gray-300 text-sm">

                                    {

                                        orders.map((order, index) => (

                                            <div
                                                key={order._id || index}
                                                className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300"
                                            >


                                                {/* Product Info */}

                                                <div className="flex-1 flex gap-5 max-w-80">

                                                    <Image
                                                        className="max-w-16 max-h-16 object-cover"
                                                        src={assets.box_icon}
                                                        alt="box"
                                                    />

                                                    <p className="flex flex-col gap-3">

                                                        <span className="font-medium text-base">

                                                            {

                                                                order.items
                                                                    .map(
                                                                        item =>
                                                                            item.product.name +
                                                                            ` x ${item.quantity}`
                                                                    )
                                                                    .join(", ")

                                                            }

                                                        </span>

                                                        <span>

                                                            Items :
                                                            {order.items.length}

                                                        </span>

                                                    </p>

                                                </div>



                                                {/* Address */}

                                                <div>

                                                    <p>

                                                        <span className="font-medium">

                                                            {order.address.fullName}

                                                        </span>

                                                        <br />

                                                        {order.address.area}

                                                        <br />

                                                        {

                                                            order.address.city
                                                        },

                                                        {

                                                            order.address.state

                                                        }

                                                        <br />

                                                        {

                                                            order.address.phoneNumber

                                                        }

                                                    </p>

                                                </div>



                                                {/* Amount */}

                                                <p className="font-medium my-auto">

                                                    {currency}
                                                    {order.amount}

                                                </p>



                                                {/* Status */}

                                                <div>

                                                    <p className="flex flex-col">

                                                        <span>

                                                            Method :
                                                            {order.paymentMethod || 'COD'}

                                                        </span>


                                                        <span>

                                                            Date :

                                                            {

                                                                new Date(
                                                                    order.date ||
                                                                    order.createdAt
                                                                ).toLocaleDateString()

                                                            }

                                                        </span>


                                                        <span className={`font-medium

                                                        ${order.status === 'Completed'
                                                                ? 'text-green-600'
                                                                : order.status === 'Pending'
                                                                    ? 'text-orange-600'
                                                                    : 'text-gray-600'
                                                            }

                                                        `}>

                                                            Status :
                                                            {order.status || 'Pending'}

                                                        </span>

                                                    </p>

                                                </div>


                                            </div>

                                        ))

                                    }

                                </div>

                            )

                    }

                </div>

            </div>

            <Footer />

        </>
    );

};

export default MyOrders;