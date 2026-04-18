'use client'
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import { fetchWithSession } from "@/lib/client-fetch";
import toast from "react-hot-toast";

const ProductList = () => {

  const { router } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAdminProducts = async () => {
    try {
      const { response, data } = await fetchWithSession('/api/products?includeUnapproved=true', {
        sessionSource: 'admin',
      });
      if (response.ok) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const toggleApproval = async (product) => {
    try {
      const { response, data } = await fetchWithSession(
        `/api/admin/products/${product._id}/approval`,
        {
          sessionSource: 'admin',
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isApproved: !product.isApproved,
            approvalNotes: product.isApproved ? 'Approval removed by admin' : 'Approved by admin',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product approval');
      }

      toast.success(product.isApproved ? 'Product approval removed' : 'Product approved');
      fetchAdminProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to update product approval');
    }
  }

  useEffect(() => {
    fetchAdminProducts();
  }, [])

  return (
    <div className="flex-1 min-h-screen">
      {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
        <h2 className="pb-4 text-lg font-medium">All Products</h2>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-4">
                  <img
                    src={product.image?.[0] || 'https://via.placeholder.com/128'}
                    alt={product.name}
                    className="h-24 w-24 rounded-3xl border border-slate-200 object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.category} {product.vendor?.vendorProfile?.storeName ? `- ${product.vendor.vendorProfile.storeName}` : ''}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Offer price</p>
                    <p className="mt-1 font-semibold text-slate-900">${product.offerPrice}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stock</p>
                    <p className="mt-1 font-semibold text-slate-900">{product.stock}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approval</p>
                    <p className={`mt-1 font-semibold ${product.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {product.isApproved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/admin/edit-product/${product._id}`)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleApproval(product)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    product.isApproved
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {product.isApproved ? 'Unapprove' : 'Approve'}
                </button>
                <button
                  onClick={() => router.push(`/product/${product._id}`)}
                  className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700"
                >
                  Visit product
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
              No products found.
            </div>
          )}
        </div>
      </div>}
    </div>
  );
};

export default ProductList;
