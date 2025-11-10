(() => {
	const apiBase = "/api";
	const productsListEl = document.getElementById("productsList");
	const productsCountEl = document.getElementById("productsCount");
	const usersCountEl = document.getElementById("usersCount");
	const salesValueEl = document.getElementById("salesValue");
	const searchInput = document.getElementById("searchInput");
	const addBtn = document.getElementById("addProductBtn");
	const modal = document.getElementById("productModal");
	const modalCloseBtn = document.getElementById("modalCloseBtn");
	const modalCancelBtn = document.getElementById("modalCancelBtn");
	const productForm = document.getElementById("productForm");
	const modalName = document.getElementById("modalName");
	const modalPrice = document.getElementById("modalPrice");
	const modalStock = document.getElementById("modalStock");
	const modalTitle = document.getElementById("modalTitle");
	const modalSubmitBtn = document.getElementById("modalSubmitBtn");

	let products = [];
	let filteredProducts = [];
	const currency = {
		code: "INR",
		symbol: "₹",
		rate: 83 // fallback if live fetch fails
	};
	let editingId = null;

	async function loadUsdToInrRate() {
		try {
			const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=INR");
			if (!res.ok) return;
			const data = await res.json();
			const inr = data && data.rates && data.rates.INR;
			if (typeof inr === "number" && isFinite(inr) && inr > 0) {
				currency.rate = inr;
			}
		} catch {
			// keep fallback
		}
	}

	function renderProducts(items) {
		productsListEl.innerHTML = "";
		if (!items.length) {
			productsListEl.innerHTML = `<div class="muted">No products found.</div>`;
			return;
		}
		for (const p of items) {
			const el = document.createElement("div");
			el.className = "list-item";
			const priceInInr = Number(p.price) * currency.rate;
			el.innerHTML = `
				<div style="display:flex;justify-content:space-between;align-items:center;">
					<strong>${p.name}</strong>
					<span class="pill">${currency.symbol}${priceInInr.toFixed(2)}</span>
				</div>
				<div class="muted">Stock: ${p.stock}</div>
				<div class="muted">#${(p._id || "").toString().slice(-6)}</div>
				<div class="actions">
					<button class="btn edit" data-action="edit" data-id="${p._id}">Edit</button>
					<button class="btn delete" data-action="delete" data-id="${p._id}">Delete</button>
				</div>
			`;
			productsListEl.appendChild(el);
			const editBtn = el.querySelector('button[data-action="edit"]');
			const deleteBtn = el.querySelector('button[data-action="delete"]');
			editBtn.addEventListener("click", () => openModal(p));
			deleteBtn.addEventListener("click", () => deleteProduct(p._id));
		}
	}

	function applySearch() {
		const q = (searchInput.value || "").toLowerCase().trim();
		if (!q) {
			filteredProducts = products.slice();
		} else {
			filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes(q));
		}
		renderProducts(filteredProducts);
	}

	async function loadProducts() {
		try {
			const res = await fetch(`${apiBase}/products`);
			if (!res.ok) throw new Error("Bad response");
			products = await res.json();
		} catch {
			// Fallback demo data
			products = [
				{ _id: "demo1", name: "Sample Tee", price: 19.99, stock: 42 },
				{ _id: "demo2", name: "Coffee Mug", price: 9.5, stock: 120 },
				{ _id: "demo3", name: "Wireless Mouse", price: 24.0, stock: 17 }
			];
		}
		productsCountEl.textContent = String(products.length);
		// Dummy stats for users and sales (replace with real API as needed)
		usersCountEl.textContent = "128";
		const demoSalesUsd = 12430;
		salesValueEl.textContent = `${currency.symbol}${(demoSalesUsd * currency.rate).toFixed(0)}`;

		filteredProducts = products.slice();
		renderProducts(filteredProducts);
	}

	searchInput.addEventListener("input", applySearch);
	Promise.all([loadUsdToInrRate()]).then(loadProducts);

	function isFiniteNumber(n) {
		return typeof n === "number" && isFinite(n);
	}

	function openModal(product) {
		modal.classList.add("open");
		modal.setAttribute("aria-hidden", "false");
		if (product) {
			editingId = product._id;
			modalTitle.textContent = "Edit Product";
			modalSubmitBtn.textContent = "Save Changes";
			modalName.value = product.name || "";
			modalPrice.value = String(product.price ?? "");
			modalStock.value = String(product.stock ?? "");
		} else {
			editingId = null;
			modalTitle.textContent = "Add Product";
			modalSubmitBtn.textContent = "Add Product";
			modalName.value = "";
			modalPrice.value = "";
			modalStock.value = "";
		}
		setTimeout(() => modalName.focus(), 0);
	}
	function closeModal() {
		modal.classList.remove("open");
		modal.setAttribute("aria-hidden", "true");
		editingId = null;
	}
	addBtn.addEventListener("click", openModal);
	modalCloseBtn.addEventListener("click", closeModal);
	modalCancelBtn.addEventListener("click", closeModal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) closeModal();
	});
	productForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const name = modalName.value.trim();
		const price = Number(modalPrice.value);
		const stock = Number(modalStock.value);
		if (!name) {
			alert("Name is required");
			return;
		}
		if (!isFiniteNumber(price) || price < 0) {
			alert("Invalid price");
			return;
		}
		if (!Number.isInteger(stock) || stock < 0) {
			alert("Invalid stock");
			return;
		}
		try {
			if (editingId) {
				const res = await fetch(`${apiBase}/products/${editingId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name, price, stock })
				});
				if (!res.ok) throw new Error("Failed to update product");
				const updated = await res.json();
				products = products.map(p => (p._id === editingId ? updated : p));
			} else {
				const res = await fetch(`${apiBase}/products`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name, price, stock })
				});
				if (!res.ok) throw new Error("Failed to create product");
				const created = await res.json();
				products = [created, ...products];
			}
			productsCountEl.textContent = String(products.length);
			applySearch();
			closeModal();
		} catch (err) {
			alert(err.message || "Request failed");
		}
	});

	async function deleteProduct(id) {
		if (!id) return;
		const ok = window.confirm("Delete this product?");
		if (!ok) return;
		try {
			const res = await fetch(`${apiBase}/products/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed to delete product");
			products = products.filter(p => p._id !== id);
			productsCountEl.textContent = String(products.length);
			applySearch();
		} catch (err) {
			alert(err.message || "Request failed");
		}
	}
})();


