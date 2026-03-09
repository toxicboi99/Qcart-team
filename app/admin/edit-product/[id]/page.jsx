'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import Footer from "@/components/admin/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORIES = ['Earphone', 'Headphone', 'Watch', 'Smartphone', 'Laptop', 'Camera', 'Accessories'];

const EditProduct = () => {
  const { id } = useParams();
  const router = useRouter();
  const { fetchProductData } = useAppContext();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
          setName(data.name);
          setDescription(data.description);
          setCategory(data.category);
          setPrice(String(data.price));
          setOfferPrice(String(data.offerPrice));
          setExistingImages(data.image || []);
        } else {
          toast.error('Product not found');
          router.push('/admin/product-list');
        }
      } catch {
        toast.error('Failed to load product');
        router.push('/admin/product-list');
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router]);

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewFile = (index, file) => {
    setNewFiles((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('offerPrice', offerPrice);
      formData.append('existingImages', JSON.stringify(existingImages));

      newFiles.forEach((file) => {
        if (file) formData.append('images', file);
      });

      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Product updated successfully!');
        fetchProductData?.();
        router.push('/admin/product-list');
      } else {
        toast.error(data.error || 'Failed to update product');
      }
    } catch {
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !product) {
    return <Loading />;
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {existingImages.map((url, index) => (
              <div key={`exist-${index}`} className="relative group">
                <Image
                  className="max-w-24 rounded border object-cover"
                  src={url}
                  alt=""
                  width={100}
                  height={100}
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input
                  onChange={(e) => handleNewFile(index, e.target.files?.[0])}
                  type="file"
                  id={`image${index}`}
                  accept="image/*"
                  hidden
                />
                <Image
                  className="max-w-24 cursor-pointer"
                  src={newFiles[index] ? URL.createObjectURL(newFiles[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">Product Description</label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
            disabled={loading}
          />
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">Category</label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
              disabled={loading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">Product Price</label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">Offer Price</label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-orange-600 text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'UPDATE'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/product-list')}
            className="px-8 py-2.5 border border-gray-400 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
};

export default EditProduct;
