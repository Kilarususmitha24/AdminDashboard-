import React, { useEffect, useMemo, useState } from "react";

/**
 * ProductManager
 * Props:
 * - apiBaseUrl?: string (default '/api')
 * - initialProducts?: Array<{ _id?: string, name: string, price: number, stock: number }>
 * - onChange?: (products: Array<Product>) => void
 */
export default function ProductManager(props) {
	const apiBaseUrl = props.apiBaseUrl || "/api";
	const currencyCode = props.currencyCode || "INR";
	const currencySymbol = props.currencySymbol || "₹";
	const exchangeRate = typeof props.exchangeRate === "number" && isFinite(props.exchangeRate) && props.exchangeRate > 0 ? props.exchangeRate : 83; // USD->INR default
	const [products, setProducts] = useState(props.initialProducts || []);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState({ name: "", price: "", stock: "" });

	useEffect(() => {
		if (props.initialProducts && props.initialProducts.length) return;
		let mounted = true;
		(async () => {
			setLoading(true);
			setError("");
			try {
				const res = await fetch(`${apiBaseUrl}/products`);
				if (!res.ok) throw new Error("Failed to load products");
				const data = await res.json();
				if (mounted) setProducts(data);
			} catch (e) {
				if (mounted) setError(e.message || "Error");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [apiBaseUrl, props.initialProducts]);

	useEffect(() => {
		if (props.onChange) props.onChange(products);
	}, [products]); // eslint-disable-line react-hooks/exhaustive-deps

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return products;
		return products.filter(p => (p.name || "").toLowerCase().includes(q));
	}, [products, query]);

	function resetForm() {
		setForm({ name: "", price: "", stock: "" });
		setEditingId(null);
	}

	function onEdit(product) {
		setEditingId(product._id);
		setForm({
			name: product.name,
			price: String(product.price),
			stock: String(product.stock)
		});
	}

	async function onSubmit(e) {
		e.preventDefault();
		const payload = {
			name: form.name.trim(),
			price: Number(form.price),
			stock: Number(form.stock)
		};
		if (!payload.name || isNaN(payload.price) || isNaN(payload.stock)) {
			setError("Please provide valid name, price, and stock.");
			return;
		}
		setError("");
		try {
			if (editingId) {
				const res = await fetch(`${apiBaseUrl}/products/${editingId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				if (!res.ok) throw new Error("Failed to update product");
				const updated = await res.json();
				setProducts(prev => prev.map(p => (p._id === editingId ? updated : p)));
			} else {
				const res = await fetch(`${apiBaseUrl}/products`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				if (!res.ok) throw new Error("Failed to create product");
				const created = await res.json();
				setProducts(prev => [created, ...prev]);
			}
			resetForm();
		} catch (e) {
			setError(e.message || "Request failed");
		}
	}

	async function onDelete(id) {
		if (!id) return;
		try {
			const res = await fetch(`${apiBaseUrl}/products/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed to delete product");
			setProducts(prev => prev.filter(p => p._id !== id));
			if (editingId === id) resetForm();
		} catch (e) {
			setError(e.message || "Request failed");
		}
	}

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<h2 style={{ margin: 0 }}>Product Manager</h2>
			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<input
					type="search"
					placeholder="Search products..."
					value={query}
					onChange={e => setQuery(e.target.value)}
					style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", flex: 1 }}
				/>
			</div>
			<form onSubmit={onSubmit} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 140px 120px 120px" }}>
				<input
					placeholder="Name"
					value={form.name}
					onChange={e => setForm({ ...form, name: e.target.value })}
					required
					style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}
				/>
				<input
					type="number"
					step="0.01"
					placeholder="Price (USD)"
					value={form.price}
					onChange={e => setForm({ ...form, price: e.target.value })}
					required
					style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}
				/>
				<input
					type="number"
					placeholder="Stock"
					value={form.stock}
					onChange={e => setForm({ ...form, stock: e.target.value })}
					required
					style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}
				/>
				<div style={{ display: "flex", gap: 8 }}>
					<button
						type="submit"
						style={{
							flex: 1,
							background: "#111827",
							color: "white",
							border: "1px solid #111827",
							borderRadius: 8,
							padding: "8px 12px",
							cursor: "pointer"
						}}
					>
						{editingId ? "Update" : "Add"}
					</button>
					{editingId && (
						<button
							type="button"
							onClick={resetForm}
							style={{
								background: "white",
								color: "#111827",
								border: "1px solid #e5e7eb",
								borderRadius: 8,
								padding: "8px 12px",
								cursor: "pointer"
							}}
						>
							Cancel
						</button>
					)}
				</div>
			</form>
			{error && <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>}
			{loading ? (
				<div>Loading...</div>
			) : (
				<div
					style={{
						display: "grid",
						gap: 12,
						gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))"
					}}
				>
					{filtered.map(p => (
						<div
							key={p._id}
							style={{
								border: "1px solid #e5e7eb",
								borderRadius: 10,
								padding: 12,
								display: "grid",
								gap: 6
							}}
						>
							<strong>{p.name}</strong>
							<div style={{ color: "#6b7280", fontSize: 14 }}>
								{currencySymbol}
								{(Number(p.price) * exchangeRate).toFixed(2)} {currencyCode}
								<span style={{ marginLeft: 8, color: "#9ca3af", fontSize: 12 }}>
									(${Number(p.price).toFixed(2)} USD)
								</span>
							</div>
							<div style={{ color: "#6b7280", fontSize: 14 }}>Stock: {p.stock}</div>
							<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
								<button
									type="button"
									onClick={() => onEdit(p)}
									style={{
										flex: 1,
										background: "white",
										color: "#111827",
										border: "1px solid #e5e7eb",
										borderRadius: 8,
										padding: "8px 12px",
										cursor: "pointer"
									}}
								>
									Edit
								</button>
								<button
									type="button"
									onClick={() => onDelete(p._id)}
									style={{
										flex: 1,
										background: "#dc2626",
										color: "white",
										border: "1px solid #dc2626",
										borderRadius: 8,
										padding: "8px 12px",
										cursor: "pointer"
									}}
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}


