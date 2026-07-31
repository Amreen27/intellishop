"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  PackageSearch,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface Product {
  id:          string;
  name:        string;
  description: string;
  price:       number; // in DB units (e.g. 4999.00)
  image_url:   string;
  category:    string;
  stock:       number;
  slug:        string;
}

export default function AdminProductsPage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Success message state
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen]   = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [modalMode, setModalMode]     = useState<"add" | "edit">("add");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const [formName, setFormName]               = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice]             = useState("");
  const [formImageUrl, setFormImageUrl]       = useState("");
  const [formCategory, setFormCategory]       = useState("");
  const [formStock, setFormStock]             = useState("");
  const [formSlug, setFormSlug]               = useState("");
  
  const [formError, setFormError]             = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting]   = useState(false);

  // Delete state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Auto-slug generator when name is edited
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (modalMode === "add") {
      const generatedSlug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
        .replace(/\s+/g, "-") // replace spaces with dashes
        .replace(/-+/g, "-"); // clean up duplicate dashes
      setFormSlug(generatedSlug);
    }
  };

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch products.");
      setProducts(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Show a visual success toast
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Open Form modal in Add mode
  const openAddModal = () => {
    setModalMode("add");
    setSelectedProductId(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormImageUrl("");
    setFormCategory("");
    setFormStock("");
    setFormSlug("");
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Form modal in Edit mode
  const openEditModal = (p: Product) => {
    setModalMode("edit");
    setSelectedProductId(p.id);
    setFormName(p.name);
    setFormDescription(p.description);
    setFormPrice(p.price.toString());
    setFormImageUrl(p.image_url);
    setFormCategory(p.category);
    setFormStock(p.stock.toString());
    setFormSlug(p.slug);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Delete confirmation
  const openDeleteModal = (p: Product) => {
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  // Form submit (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend checks
    if (!formName.trim())   return setFormError("Product name is required.");
    if (!formPrice.trim())  return setFormError("Price is required.");
    if (!formStock.trim())  return setFormError("Stock is required.");
    if (!formSlug.trim())   return setFormError("URL Slug is required.");

    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return setFormError("Enter a valid positive price.");
    }

    const parsedStock = parseInt(formStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return setFormError("Enter a valid positive stock integer.");
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name:        formName.trim(),
        description: formDescription.trim(),
        price:       parsedPrice,
        image_url:   formImageUrl.trim(),
        category:    formCategory.trim(),
        stock:       parsedStock,
        slug:        formSlug.trim().toLowerCase(),
      };

      const url = modalMode === "add" 
        ? "/api/admin/products" 
        : `/api/admin/products/${selectedProductId}`;
      
      const method = modalMode === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save product.");

      setIsFormModalOpen(false);
      triggerSuccess(
        modalMode === "add"
          ? "Product created successfully!"
          : "Product updated successfully!"
      );
      fetchProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete product.");

      setIsDeleteModalOpen(false);
      triggerSuccess("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleteSubmitting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Success Notification Banners */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-3 duration-250">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Product Catalog
          </h1>
          <p className="text-sm text-secondary mt-1">
            Create, update, or remove store products.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="
            inline-flex items-center justify-center gap-2
            rounded-2xl bg-accent px-5 py-3
            text-sm font-bold text-primary-foreground
            shadow-lg shadow-accent/25
            transition hover:brightness-110 hover:-translate-y-0.5
            active:translate-y-0
          "
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="flex h-60 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-sm text-muted">Loading products catalog...</p>
          </div>
        </div>
      )}

      {/* Fetch Errors */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 border border-border bg-surface rounded-2xl p-12 text-center">
          <PackageSearch size={40} className="text-muted" />
          <p className="text-base font-semibold text-foreground">Catalog Unavailable</p>
          <p className="text-sm text-secondary max-w-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 border border-border bg-surface rounded-2xl py-20 text-center">
          <PackageSearch size={44} className="text-muted" />
          <p className="text-base font-semibold text-foreground">No products found</p>
          <p className="text-sm text-secondary">Get started by creating your first product.</p>
        </div>
      )}

      {/* Catalog Table */}
      {!loading && !error && products.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-background/20 transition-colors">
                  {/* Info */}
                  <td className="px-5 py-4 min-w-[200px]">
                    <div className="font-semibold text-foreground">{product.name}</div>
                    <div className="text-xs text-muted mt-0.5 font-mono">{product.slug}</div>
                  </td>
                  {/* Category */}
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs text-secondary">
                      {product.category || "Uncategorized"}
                    </span>
                  </td>
                  {/* Price */}
                  <td className="px-5 py-4 font-mono font-bold text-foreground">
                    ${product.price.toFixed(2)}
                  </td>
                  {/* Stock */}
                  <td className="px-5 py-4">
                    {product.stock > 0 ? (
                      <span className="text-sm font-semibold text-success">{product.stock} units</span>
                    ) : (
                      <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">Out of Stock</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${product.name}`}
                        className="rounded-lg p-2 text-secondary hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        aria-label={`Delete ${product.name}`}
                        className="rounded-lg p-2 text-muted hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Form Modal (Add / Edit) ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface shadow-2xl p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h2 className="text-lg font-bold text-foreground">
                {modalMode === "add" ? "Add Product" : "Edit Product"}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 border border-error/20 bg-error/5 rounded-xl p-3 text-xs text-error">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Product Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Mechanical Gaming Keyboard"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">URL Slug (Unique)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. mechanical-gaming-keyboard"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 79.99"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
                  />
                </div>

                {/* Stock */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase">Stock Qty</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Category</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Electronics"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
                />
              </div>

              {/* Image URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Image URL</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the product details..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-primary-foreground shadow shadow-accent/20 hover:brightness-110 disabled:opacity-60 transition"
                >
                  {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {modalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-surface shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-lg font-bold text-foreground">
              Delete Product
            </h2>
            
            <p className="text-sm text-secondary leading-relaxed mt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">{productToDelete.name}</span>? 
              This action cannot be undone and will immediately remove this item from the storefront.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleteSubmitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-error px-4 py-3 text-sm font-bold text-white shadow shadow-error/20 hover:brightness-110 disabled:opacity-60 transition"
              >
                {deleteSubmitting && <Loader2 size={16} className="animate-spin" />}
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
