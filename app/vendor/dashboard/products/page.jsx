'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import DashboardHeader from "@/components/vendor/DashboardHeader";
import { fetchWithSession } from "@/lib/client-fetch";
import { useVendorDashboard } from "@/lib/hooks/useVendorDashboard";

const PRODUCT_CATEGORIES = [
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

const PRODUCT_IMAGE_LIMIT = 4;

const emptyForm = {
  name: "",
  description: "",
  category: "electronics",
  price: "",
  offerPrice: "",
  discount: "",
  stock: "100",
  variants: "",
};

function createImageSlots(images = []) {
  return Array.from({ length: PRODUCT_IMAGE_LIMIT }, (_, index) =>
    images[index]
      ? {
          type: "existing",
          url: images[index],
        }
      : null
  );
}

function revokeSlotPreview(slot) {
  if (slot?.type === "new" && slot.previewUrl) {
    URL.revokeObjectURL(slot.previewUrl);
  }
}

function getSlotLabel(index) {
  return index === 0 ? "Main image" : `Gallery image ${index}`;
}

export default function VendorProductsPage() {
  const { dashboard, loading, error, refresh } = useVendorDashboard();
  const [form, setForm] = useState(emptyForm);
  const [imageSlots, setImageSlots] = useState(() => createImageSlots());
  const [editingId, setEditingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const imageSlotsRef = useRef(imageSlots);

  const products = useMemo(() => dashboard?.products || [], [dashboard?.products]);
  const vendorApproved = Boolean(dashboard?.vendor?.isApproved && !dashboard?.vendor?.isBlocked);

  useEffect(() => {
    imageSlotsRef.current = imageSlots;
  }, [imageSlots]);

  useEffect(() => {
    return () => {
      imageSlotsRef.current.forEach(revokeSlotPreview);
    };
  }, []);

  useEffect(() => {
    if (!editingId) {
      setForm(emptyForm);
      setImageSlots((current) => {
        current.forEach(revokeSlotPreview);
        return createImageSlots();
      });
    }
  }, [editingId]);

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
      ),
    [products]
  );

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "electronics",
      price: String(product.price ?? ""),
      offerPrice: String(product.offerPrice ?? ""),
      discount: String(product.discount ?? ""),
      stock: String(product.stock ?? "100"),
      variants: Array.isArray(product.variants) ? product.variants.join(", ") : "",
    });
    setImageSlots((current) => {
      current.forEach(revokeSlotPreview);
      return createImageSlots(product.image || []);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setImageSlots((current) => {
      current.forEach(revokeSlotPreview);
      return createImageSlots();
    });
  };

  const updateImageSlot = (slotIndex, file) => {
    if (!file) {
      return;
    }

    setImageSlots((current) => {
      const next = [...current];
      revokeSlotPreview(next[slotIndex]);
      next[slotIndex] = {
        type: "new",
        file,
        previewUrl: URL.createObjectURL(file),
      };
      return next;
    });
  };

  const removeImageSlot = (slotIndex) => {
    setImageSlots((current) => {
      const next = [...current];
      revokeSlotPreview(next[slotIndex]);
      next[slotIndex] = null;
      return next;
    });
  };

  const makeMainImage = (slotIndex) => {
    if (slotIndex === 0) {
      return;
    }

    setImageSlots((current) => {
      if (!current[slotIndex]) {
        return current;
      }

      const next = [...current];
      [next[0], next[slotIndex]] = [next[slotIndex], next[0]];
      return next;
    });
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (!imageSlots[0]) {
        throw new Error("Main product image is required.");
      }

      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append(
        "variants",
        JSON.stringify(
          form.variants
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      const existingImages = [];
      const imageOrder = [];
      const uploadFiles = [];

      imageSlots.forEach((slot) => {
        if (!slot) {
          return;
        }

        if (slot.type === "existing") {
          existingImages.push(slot.url);
          imageOrder.push({
            type: "existing",
            value: slot.url,
          });
          return;
        }

        if (slot.type === "new" && slot.file) {
          const uploadIndex = uploadFiles.length;
          uploadFiles.push(slot.file);
          imageOrder.push({
            type: "upload",
            value: uploadIndex,
          });
        }
      });

      body.append("existingImages", JSON.stringify(existingImages));
      body.append("imageOrder", JSON.stringify(imageOrder));
      uploadFiles.forEach((file) => {
        body.append("images", file);
      });

      const endpoint = editingId
        ? `/api/vendors/products/${editingId}`
        : "/api/vendors/products";
      const method = editingId ? "PUT" : "POST";
      const { response, data } = await fetchWithSession(endpoint, {
        sessionSource: "user",
        method,
        body,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      toast.success(editingId ? "Product updated successfully." : "Product created successfully.");
      resetForm();
      refresh({ silent: true });
    } catch (submitError) {
      toast.error(submitError.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this product permanently?")) {
      return;
    }

    setDeletingId(productId);

    try {
      const { response, data } = await fetchWithSession(`/api/vendors/products/${productId}`, {
        sessionSource: "user",
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete product.");
      }

      toast.success("Product deleted successfully.");
      refresh({ silent: true });
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete product.");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error || "Unable to load vendor products."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader dashboard={dashboard} />

      <div className="space-y-6 p-5 md:p-8">
        {!vendorApproved && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
            Admin approval is still pending. You can edit drafts, but new vendor
            products will stay pending until approval is granted.
          </div>
        )}

        <form
          onSubmit={submitProduct}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Product Manager
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {editingId ? "Edit vendor product" : "Add a new vendor product"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Product name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                required
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              >
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Stock</span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stock: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Offer price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.offerPrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, offerPrice: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Discount (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.discount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, discount: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Variants</span>
              <input
                value={form.variants}
                onChange={(event) =>
                  setForm((current) => ({ ...current, variants: event.target.value }))
                }
                placeholder="Example: Red, Blue, XL, 128GB"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Upload images</span>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Add up to 4 product images. The first slot is the main image and the
                next 3 slots are gallery images.
              </p>
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {imageSlots.map((slot, index) => (
              <div
                key={`product-image-slot-${index}`}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getSlotLabel(index)}</p>
                    <p className="text-xs text-slate-500">
                      {index === 0 ? "Required" : "Optional"}
                    </p>
                  </div>
                  {slot && index > 0 ? (
                    <button
                      type="button"
                      onClick={() => makeMainImage(index)}
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-600"
                    >
                      Set main
                    </button>
                  ) : null}
                </div>

                {slot ? (
                  <img
                    src={slot.type === "existing" ? slot.url : slot.previewUrl}
                    alt={getSlotLabel(index)}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-400">
                    {index === 0
                      ? "Upload the main product image here."
                      : "Upload an additional gallery image."}
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-200 p-4">
                  <label className="block">
                    <span className="sr-only">{getSlotLabel(index)}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        updateImageSlot(index, event.target.files?.[0] || null);
                        event.target.value = "";
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-[10px] text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:font-semibold file:text-orange-700 hover:file:bg-orange-200"
                    />
                  </label>

                  {slot ? (
                    <button
                      type="button"
                      onClick={() => removeImageSlot(index)}
                      className="w-full rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700"
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving product..." : editingId ? "Update product" : "Create product"}
          </button>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Product Catalog
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Your vendor products
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{products.length}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedProducts.map((product) => (
              <div
                key={product._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex gap-4">
                    <img
                      src={product.image?.[0] || "/payment-qr.svg"}
                      alt={product.name}
                      className="h-24 w-24 rounded-3xl border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Price</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        ${product.offerPrice}{" "}
                        <span className="text-sm font-normal text-slate-400 line-through">
                          ${product.price}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stock</p>
                      <p className="mt-2 font-semibold text-slate-900">{product.stock}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approval</p>
                      <p
                        className={`mt-2 font-semibold ${
                          product.isApproved ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {product.isApproved ? "Approved" : "Pending review"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Variants</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {Array.isArray(product.variants) && product.variants.length > 0
                          ? product.variants.join(", ")
                          : "No variants"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product._id)}
                    disabled={deletingId === product._id}
                    className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
                  >
                    {deletingId === product._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
                No products yet. Add your first vendor product above.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
