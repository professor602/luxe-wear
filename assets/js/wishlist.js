/* =====================================================================
   LuxeWear – wishlist.js
   Powers wishlist.html. The wishlist is a list of product IDs saved in
   LocalStorage (see storage.js: getWishlist, removeFromWishlist, addToCart).

   Note: buttons here use data-wl-action (not data-action) so the global
   handler in common.js does not also react to them.
   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

// Cards fade in on the first render only, not after every removal.
let wishlistFirstRender = true;

function renderWishlist() {
  const container = document.getElementById("wishlist-content");
  if (!container) return;

  const products = getWishlist().map(function (id) { return getProductById(id); }).filter(Boolean);

  const subtitle = document.getElementById("wishlist-subtitle");
  if (subtitle) {
    subtitle.textContent = products.length === 0
      ? "Save the pieces you love and find them here."
      : products.length + (products.length === 1 ? " saved item" : " saved items");
  }

  // Empty state
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-heart"></i>
        <h3>Your wishlist is empty</h3>
        <p>Tap the heart on any product to save it here for later.</p>
        <a href="shop.html" class="btn btn-primary">Discover Products</a>
      </div>`;
    return;
  }

  // Each product card is followed by Move to Cart / Remove buttons
  const itemsHtml = products.map(function (product) {
    return '<div class="wishlist-item">' +
      renderProductCard(product) +
      '<div class="wishlist-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-wl-action="move" data-id="' + product.id + '">' +
      '<i class="fa-solid fa-bag-shopping"></i> Move to Cart</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-wl-action="remove" data-id="' + product.id + '">' +
      '<i class="fa-regular fa-trash-can"></i> Remove</button>' +
      "</div></div>";
  }).join("");

  container.innerHTML =
    '<p class="results-count">Tip: Move to Cart uses the first size and color. Open a product to choose others.</p>' +
    '<div class="product-grid" id="wishlist-grid">' + itemsHtml + "</div>";

  // The hover "Add to Cart" overlay is replaced by the Move to Cart button
  container.querySelectorAll(".quick-actions").forEach(function (overlay) { overlay.remove(); });

  if (wishlistFirstRender) {
    container.querySelectorAll(".product-card").forEach(function (card, index) {
      card.classList.add("rendered");
      card.style.animationDelay = Math.min(index, 11) * 50 + "ms";
    });
    wishlistFirstRender = false;
  }

  syncWishlistButtons(); // fill the heart icons
}

// Add to cart, then take it off the wishlist.
function moveToCart(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const item = addToCart(productId);
  if (!item) return;
  removeFromWishlist(productId);
  showToast(product.name + " (" + item.size + ", " + item.color + ") moved to cart", "success");
}

function removeFromWishlistWithToast(productId) {
  const product = getProductById(productId);
  removeFromWishlist(productId);
  if (product) showToast(product.name + " removed from wishlist", "info");
}

function initWishlistEvents() {
  const container = document.getElementById("wishlist-content");
  if (!container) return;

  container.addEventListener("click", function (event) {
    const button = event.target.closest("[data-wl-action]");
    if (!button) return;

    const productId = Number(button.dataset.id);
    if (button.dataset.wlAction === "move") {
      moveToCart(productId);
    } else if (button.dataset.wlAction === "remove") {
      removeFromWishlistWithToast(productId);
    }
  });
}

onReady(function () {
  renderWishlist();
  initWishlistEvents();

  // Re-render when the wishlist changes. This also covers the heart button
  // on each card (handled in common.js), which removes the item.
  window.addEventListener("luxewear:storage-change", renderWishlist);
  window.addEventListener("luxewear:storage-change-external", renderWishlist);
});