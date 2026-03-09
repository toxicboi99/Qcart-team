'use client'
import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

const CATEGORIES = ['All', 'Earphone', 'Headphone', 'Watch', 'Smartphone', 'Laptop', 'Camera', 'Accessories'];

const AllProducts = () => {
    const { products } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') return products;
        return products.filter((p) => p.category === selectedCategory);
    }, [products, selectedCategory]);

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full pt-12 gap-4">
                    <div className="flex flex-col items-end md:items-start">
                        <p className="text-2xl font-medium">All products</p>
                        <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                    selectedCategory === cat
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
                    {filteredProducts.map((product, index) => (
                        <ProductCard key={product._id || index} product={product} />
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;
