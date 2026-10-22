/* =====================================================================
   LuxeWear – cart.js
   Powers cart.html. All cart data lives in storage.js (LocalStorage):
   getCartSummary, updateCartQty, removeFromCart, isSameCartLine.

   A "line" identifies one cart row: { id, size, color }.
   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

// Remembers which button was used so focus can return to it after re-render.
let pendingFocusKey = null;

/* ---------------------------------------------------------------------
   1. HTML builders
   ------------------------------------------------------------------ */

// One row of the cart (image, details, quantity, line total).
function cartItemHtml(item) {
  const product = item.product;
  const name = escapeHTML(product.name);
  const size = escapeHTML(item.size);
  const color = escapeHTML(item.color);
  const keyBase = escapeHTML(item.id + "|" + item.size + "|" + item.color);
  const url = "product-details.html?id=" + product.id;
  const atMin = item.qty <= 1;
  const atMax = item.qty >= MAX_QTY_PER_ITEM;

  return `
    <article class="cart-item" data-id="${item.id}" data-size="${size}" data-color="${color}">
      <a href="${url}" aria-label="View ${name}">
        <img class="cart-item-image" src="${product.image}" alt="${name}" loading="lazy">
      </a>

      <div>
        <h3><a href="${url}">${name}</a></h3>
        <p class="cart-item-meta">Size: ${size} &middot; Color: ${color}</p>
        <p class="cart-item-meta">${formatPrice(product.price)} each</p>
        <button type="button" class="remove-btn" data-cart-action="remove" data-key="${keyBase}|remove">
          <i class="fa-regular fa-trash-can"></i> Remove
        </button>
      </div>

      <div class="qty-selector">
        <button type="button" data-cart-action="minus" data-key="${keyBase}|minus"
                aria-label="Decrease quantity of ${name}"${atMin ? " disabled" : ""}>&minus;</button>
        <span class="qty-value" aria-label="Quantity">${item.qty}</span>
        <button type="button" data-cart-action="plus" data-key="${keyBase}|plus"
                aria-label="Increase quantity of ${name}"${atMax ? " disabled" : ""}>+</button>
      </div>

      <div class="cart-item-total">${formatPrice(item.lineTotal)}</div>
    </article>`;
}

// The order summary box with the free-shipping progress bar.
function cartSummaryHtml(summary) {
  const remaining = FREE_SHIPPING_THRESHOLD - summary.subtotal;
  const percent = Math.min(100, Math.round((summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const shippingText = summary.shipping === 0 ? "Free" : formatPrice(summary.shipping);
  const note = remaining > 0
    ? "Add " + formatPrice(remaining) + " more to get free shipping."
    : "You have unlocked free shipping!";

  return `
    <aside class="summary-box" aria-label="Order summary">
      <h3>Order Summary</h3>
      <div class="summary-row"><span>Subtotal (${summary.count} ${summary.count === 1 ? "item" : "items"})</span><span>${formatPrice(summary.subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shippingText}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(summary.total)}</span></div>

      <div class="progress" role="progressbar" aria-label="Progress to free shipping"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <div class="progress-bar" style="width: ${percent}%;"></div>
      </div>
      <p class="summary-note">${note}</p>

      <a href="checkout.html" class="btn btn-primary btn-block">Proceed to Checkout</a>
      <a href="shop.html" class="btn btn-outline btn-block" style="margin-top: 10px;">Continue Shopping</a>
    </aside>`;
}

function emptyCartHtml() {
  return `
    <div class="empty-state">
      <i class="fa-solid fa-bag-shopping"></i>
      <h3>Your cart is empty</h3>
      <p>Looks like you have not added anything yet. Explore our collections to find something you love.</p>
      <a href="shop.html" class="btn btn-primary">Start Shopping</a>
    </div>`;
}

/* ---------------------------------------------------------------------
   2. Rendering
   ------------------------------------------------------------------ */
function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  const summary = getCartSummary();

  const subtitle = document.getElementById("cart-subtitle");
  if (subtitle) {
    subtitle.textContent = summary.count === 0
      ? "Your cart is currently empty."
      : summary.count + (summary.count === 1 ? " item" : " items") + " in your cart";
  }

  if (summary.items.length === 0) {
    container.innerHTML = emptyCartHtml();
    return;
  }

  container.innerHTML =
    '<div class="cart-layout">' +
    '<div class="cart-list">' + summary.items.map(cartItemHtml).join("") + "</div>" +
    cartSummaryHtml(summary) +
    "</div>";

  restoreFocus(container);
}

// After re-rendering, put keyboard focus back on the button that was used.
function restoreFocus(container) {
  if (!pendingFocusKey) return;

  const buttons = container.querySelectorAll("[data-key]");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].dataset.key === pendingFocusKey && !buttons[i].disabled) {
      buttons[i].focus();
      break;
    }
  }
  pendingFocusKey = null;
}

/* ---------------------------------------------------------------------
   3. Actions
   ------------------------------------------------------------------ */

// Build the { id, size, color } line from a cart row element.
function lineFromRow(row) {
  return { id: Number(row.dataset.id), size: row.dataset.size, color: row.dataset.color };
}

// Play the exit animation, then remove the line from storage.
function removeLineAnimated(row, line) {
  if (row.dataset.removing) return; // ignore double clicks
  row.dataset.removing = "1";

  const product = getProductById(line.id);
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    removeFromCart(line); // saves and triggers a re-render
    if (product) showToast(product.name + " removed from cart", "info");
  }

  row.classList.add("removing");
  row.addEventListener("animationend", finish, { once: true });
  setTimeout(finish, 500); // safety net if the animation event never fires
}

function initCartEvents() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  container.addEventListener("click", function (event) {
    const button = event.target.closest("[data-cart-action]");
    if (!button || button.disabled) return;

    const row = button.closest(".cart-item");
    if (!row) return;

    const line = lineFromRow(row);
    const current = getCart().find(function (item) { return isSameCartLine(item, line); });
    if (!current) return;

    pendingFocusKey = button.dataset.key;

    switch (button.dataset.cartAction) {
      case "plus":
        updateCartQty(line, current.qty + 1);
        break;
      case "minus":
        if (current.qty > 1) updateCartQty(line, current.qty - 1);
        break;
      case "remove":
        pendingFocusKey = null;
        removeLineAnimated(row, line);
        break;
    }
  });
}

/* ---------------------------------------------------------------------
   4. Start
   ------------------------------------------------------------------ */
onReady(function () {
  renderCart();
  initCartEvents();

  // Re-render when the cart changes (this tab or another tab)
  window.addEventListener("luxewear:storage-change", renderCart);
  window.addEventListener("luxewear:storage-change-external", renderCart);
});