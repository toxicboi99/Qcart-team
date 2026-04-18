"use client"
import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import React from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart, handleBuyNow, userData, isAuthenticated } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

    const submitReview = async (event) => {
        event.preventDefault();

        if (!isAuthenticated || !userData?._id) {
            toast.error("Please sign in to review this product.");
            router.push('/signin?return=/product/' + id);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/products/${id}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userData._id,
                    rating: reviewForm.rating,
                    comment: reviewForm.comment,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit review.");
            }

            toast.success("Review submitted successfully.");
            setReviewForm({ rating: 5, comment: "" });
            try {
                const refreshResponse = await fetch(`${API_URL}/api/products/${id}/reviews`);
                const refreshData = await refreshResponse.json();
                setReviews(refreshResponse.ok && Array.isArray(refreshData) ? refreshData : []);
            } catch {
                setReviews([]);
            }
        } catch (error) {
            toast.error(error.message || "Failed to submit review.");
        }
    }

    useEffect(() => {
        const product = products.find(product => product._id === id);
        setProductData(product);
    }, [id, products])

    useEffect(() => {
        if (!id) return;

        const loadReviews = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/${id}/reviews`);
                const data = await res.json();
                if (res.ok) {
                    setReviews(Array.isArray(data) ? data : []);
                } else {
                    setReviews([]);
                }
            } catch {
                setReviews([]);
            }
        };

        loadReviews();
    }, [id])

    return productData ? (<>
        <Navbar />
        <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="px-5 lg:px-16 xl:px-20">
                    <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
                        <Image
                            src={mainImage || productData.image?.[0] || 'https://via.placeholder.com/600'}
                            alt="alt"
                            className="w-full h-auto object-cover mix-blend-multiply"
                            width={1280}
                            height={720}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {(productData.image || []).map((image, index) => (
                            <div
                                key={index}
                                onClick={() => setMainImage(image)}
                                className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10"
                            >
                                <Image
                                    src={image}
                                    alt="alt"
                                    className="w-full h-auto object-cover mix-blend-multiply"
                                    width={1280}
                                    height={720}
                                />
                            </div>

                        ))}
                    </div>
                </div>

                <div className="flex flex-col">
                    <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
                        {productData.name}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image
                                className="h-4 w-4"
                                src={assets.star_dull_icon}
                                alt="star_dull_icon"
                            />
                        </div>
                        <p>(4.5)</p>
                    </div>
                    <p className="text-gray-600 mt-3">
                        {productData.description}
                    </p>
                    <p className="text-3xl font-medium mt-6">
                        ${productData.offerPrice}
                        <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                            ${productData.price}
                        </span>
                    </p>
                    <hr className="bg-gray-600 my-6" />
                    <div className="overflow-x-auto">
                        <table className="table-auto border-collapse w-full max-w-72">
                            <tbody>
                                <tr>
                                    <td className="text-gray-600 font-medium">Brand</td>
                                    <td className="text-gray-800/50 ">Generic</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Color</td>
                                    <td className="text-gray-800/50 ">Multi</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Category</td>
                                    <td className="text-gray-800/50">
                                        {productData.category}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Stock</td>
                                    <td className="text-gray-800/50 ">{productData.stock ?? "Available"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center mt-10 gap-4">
                        <button onClick={() => addToCart(productData._id)} className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition">
                            Add to Cart
                        </button>
                        <button onClick={() => handleBuyNow(productData._id)} className="w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition">
                            Buy now
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4 mt-16">
                    <p className="text-3xl font-medium">Featured <span className="font-medium text-orange-600">Products</span></p>
                    <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
                    {products.slice(0, 5).map((product, index) => <ProductCard key={index} product={product} />)}
                </div>
                <button className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
                    See more
                </button>
            </div>

            <div className="grid gap-8 pb-16 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                                Customer Reviews
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                What buyers are saying
                            </h2>
                        </div>
                        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                            <p className="text-xs uppercase tracking-[0.16em] text-white/70">Total</p>
                            <p className="mt-1 text-xl font-semibold">{reviews.length}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {review.author?.fullName || "Customer"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Rating: {review.rating}/5
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {review.comment}
                                </p>
                                {review.reply && (
                                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                                        <p className="font-semibold">Vendor reply</p>
                                        <p className="mt-2 leading-7">{review.reply}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {reviews.length === 0 && (
                            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                                No reviews yet.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
                        Write A Review
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                        Share your experience
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                        Reviews help vendors improve their stores and help other buyers shop with confidence.
                    </p>

                    <form onSubmit={submitReview} className="mt-6 space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-white/80">Rating</span>
                            <select
                                value={reviewForm.rating}
                                onChange={(event) =>
                                    setReviewForm((current) => ({
                                        ...current,
                                        rating: Number(event.target.value),
                                    }))
                                }
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                            >
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <option key={rating} value={rating} className="text-slate-900">
                                        {rating} Stars
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-white/80">Comment</span>
                            <textarea
                                value={reviewForm.comment}
                                onChange={(event) =>
                                    setReviewForm((current) => ({
                                        ...current,
                                        comment: event.target.value,
                                    }))
                                }
                                className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                                placeholder="Tell us about product quality, delivery, and overall experience"
                                required
                            />
                        </label>
                        <button
                            type="submit"
                            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
                        >
                            Submit review
                        </button>
                    </form>
                </section>
            </div>
        </div>
        <Footer />
    </>
    ) : <Loading />
};

export default Product;
