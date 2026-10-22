/* =====================================================================
   LuxeWear – product-details.js
   Powers product-details.html?id=<number>

   - Reads the product from PRODUCTS (products.js) using the URL id.
   - Add to cart saves the chosen size, color and quantity.
   - Wishlist button uses data-action="wishlist" (handled in common.js).

   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

// The current product and the user's current choices
let currentProduct = null;
const detailState = { size: "", color: "", qty: 1 };

/* ---------------------------------------------------------------------
   1. Small render helpers
   ------------------------------------------------------------------ */

function renderBreadcrumb(product) {
  const box = document.getElementById("breadcrumb");
  if (!box) return;

  box.innerHTML =
    '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ' +
    '<a href="' + product.category + '.html">' + capitalize(product.category) + "</a> / " +
    "<span>" + escapeHTML(product.name) + "</span>";
}

function sizeButtonsHtml(product) {
  return product.sizes.map(function (size, index) {
    const active = index === 0;
    return '<button type="button" class="size-btn' + (active ? " active" : "") + '"' +
           ' data-size="' + escapeHTML(size) + '" aria-pressed="' + active + '">' +
           escapeHTML(size) + "</button>";
  }).join("");
}

function colorButtonsHtml(product) {
  return product.colors.map(function (color, index) {
    const active = index === 0;
    return '<button type="button" class="color-swatch' + (active ? " active" : "") + '"' +
           ' data-color="' + escapeHTML(color.name) + '"' +
           ' style="background:' + color.hex + ';"' +
           ' aria-label="' + escapeHTML(color.name) + '" title="' + escapeHTML(color.name) + '"' +
           ' aria-pressed="' + active + '"></button>';
  }).join("");
}

function galleryHtml(product) {
  const name = escapeHTML(product.name);

  const thumbs = product.gallery.map(function (url, index) {
    return '<button type="button" class="gallery-thumb' + (index === 0 ? " active" : "") + '"' +
           ' data-thumb="' + index + '" aria-label="Show image ' + (index + 1) + '">' +
           '<img src="' + url + '" alt="' + name + ' view ' + (index + 1) + '" loading="lazy"></button>';
  }).join("");

  return '<div class="gallery reveal-left">' +
         '<div class="gallery-main" id="gallery-main">' +
         '<img id="gallery-main-img" src="' + product.gallery[0] + '" alt="' + name + '" width="800" height="1000">' +
         "</div>" +
         '<div class="gallery-thumbs">' + thumbs + "</div></div>";
}

/* ---------------------------------------------------------------------
   2. Build the whole details section
   ------------------------------------------------------------------ */
function renderProductDetail(product) {
  const container = document.getElementById("product-detail");
  const name = escapeHTML(product.name);

  let oldPriceHtml = "";
  if (product.oldPrice) {
    const percent = Math.round((1 - product.price / product.oldPrice) * 100);
    oldPriceHtml = '<span class="price-old">' + formatPrice(product.oldPrice) + "</span>" +
                   '<span class="save-tag">Save ' + percent + "%</span>";
  }

  const infoHtml = `
    <div class="detail-info reveal-right">
      <span class="section-eyebrow">${capitalize(product.category)} &middot; ${capitalize(product.type)}</span>
      <h1>${name}</h1>

      <div class="detail-rating" title="Rated ${product.rating} out of 5">
        ${renderStars(product.rating)} <span>${product.rating.toFixed(1)} out of 5</span>
      </div>

      <p class="detail-price">${formatPrice(product.price)}${oldPriceHtml}</p>
      <p class="detail-description">${escapeHTML(product.description)}</p>

      <div class="option-group">
        <h4>Size <span id="selected-size">${escapeHTML(detailState.size)}</span></h4>
        <div class="size-options" role="group" aria-label="Choose a size">${sizeButtonsHtml(product)}</div>
      </div>

      <div class="option-group">
        <h4>Color <span id="selected-color">${escapeHTML(detailState.color)}</span></h4>
        <div class="color-options" role="group" aria-label="Choose a color">${colorButtonsHtml(product)}</div>
      </div>

      <div class="option-group">
        <h4>Quantity</h4>
        <div class="qty-selector">
          <button type="button" data-qty="minus" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-value" id="qty-value" aria-live="polite">1</span>
          <button type="button" data-qty="plus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div class="detail-actions">
        <button type="button" class="btn btn-primary" id="add-to-cart-btn">
          <i class="fa-solid fa-bag-shopping"></i> Add to Cart
        </button>
        <button type="button" class="btn btn-outline wishlist-toggle" data-action="wishlist"
                data-id="${product.id}" aria-pressed="false">
          <i class="fa-regular fa-heart"></i> <span class="wishlist-label">Add to Wishlist</span>
        </button>
      </div>

      <div class="detail-meta">
        <span><i class="fa-solid fa-truck-fast"></i> Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}</span>
        <span><i class="fa-solid fa-rotate-left"></i> 30-day easy returns</span>
        <span><i class="fa-solid fa-shield-halved"></i> Demo store: no real orders or payments</span>
      </div>
    </div>`;

  container.innerHTML = '<div class="product-detail">' + galleryHtml(product) + infoHtml + "</div>";
}

/* ---------------------------------------------------------------------
   3. Gallery
   ------------------------------------------------------------------ */

// Fade to another gallery image and highlight its thumbnail.
function changeGalleryImage(index) {
  const mainImg = document.getElementById("gallery-main-img");
  if (!mainImg || !currentProduct.gallery[index]) return;

  document.querySelectorAll(".gallery-thumb").forEach(function (thumb) {
    thumb.classList.toggle("active", Number(thumb.dataset.thumb) === index);
  });

  if (prefersReducedMotion()) {
    mainImg.src = currentProduct.gallery[index];
    return;
  }

  mainImg.style.opacity = "0";
  setTimeout(function () {
    mainImg.onload = function () { mainImg.style.opacity = "1"; };
    mainImg.onerror = function () { mainImg.style.opacity = "1"; };
    mainImg.src = currentProduct.gallery[index];
  }, 200);
}

// Zoom follows the mouse: the zoom origin is set to the pointer position.
function initGalleryZoom() {
  const frame = document.getElementById("gallery-main");
  const image = document.getElementById("gallery-main-img");
  if (!frame || !image) return;

  frame.addEventListener("mousemove", function (event) {
    const box = frame.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    image.style.transformOrigin = x + "% " + y + "%";
  });
  frame.addEventListener("mouseleave", function () {
    image.style.transformOrigin = "center center";
  });
}

/* ---------------------------------------------------------------------
   4. Size, color, quantity
   ------------------------------------------------------------------ */
function selectSize(size) {
  detailState.size = size;
  document.querySelectorAll("[data-size]").forEach(function (button) {
    const active = button.dataset.size === size;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("selected-size").textContent = size;
}

function selectColor(colorName) {
  detailState.color = colorName;
  document.querySelectorAll("[data-color]").forEach(function (button) {
    const active = button.dataset.color === colorName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("selected-color").textContent = colorName;
}

function setQuantity(qty) {
  detailState.qty = Math.min(Math.max(qty, 1), MAX_QTY_PER_ITEM);
  document.getElementById("qty-value").textContent = detailState.qty;

  const minus = document.querySelector('[data-qty="minus"]');
  const plus = document.querySelector('[data-qty="plus"]');
  if (minus) minus.disabled = detailState.qty <= 1;
  if (plus) plus.disabled = detailState.qty >= MAX_QTY_PER_ITEM;
}

/* ---------------------------------------------------------------------
   5. Add to cart and wishlist label
   ------------------------------------------------------------------ */
function handleAddToCart() {
  const button = document.getElementById("add-to-cart-btn");
  const item = addToCart(currentProduct.id, detailState.qty, detailState.size, detailState.color);
  if (!item) return;

  showToast(
    detailState.qty + " \u00d7 " + currentProduct.name +
    " (" + detailState.size + ", " + detailState.color + ") added to cart",
    "success"
  );

  if (!button.classList.contains("added")) {
    const originalHtml = button.innerHTML;
    button.classList.add("added");
    button.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart';
    setTimeout(function () {
      button.classList.remove("added");
      button.innerHTML = originalHtml;
    }, 1600);
  }
}

// Keep the wishlist button text in step with what is saved.
function updateWishlistLabel() {
  if (!currentProduct) return;
  const label = document.querySelector(".wishlist-label");
  if (label) {
    label.textContent = isInWishlist(currentProduct.id) ? "Saved to Wishlist" : "Add to Wishlist";
  }
}

/* ---------------------------------------------------------------------
   6. Events (one click listener for the whole details section)
   ------------------------------------------------------------------ */
function initDetailEvents() {
  const container = document.getElementById("product-detail");

  container.addEventListener("click", function (event) {
    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) { selectSize(sizeButton.dataset.size); return; }

    const colorButton = event.target.closest("[data-color]");
    if (colorButton) { selectColor(colorButton.dataset.color); return; }

    const thumb = event.target.closest("[data-thumb]");
    if (thumb) { changeGalleryImage(Number(thumb.dataset.thumb)); return; }

    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
      setQuantity(detailState.qty + (qtyButton.dataset.qty === "plus" ? 1 : -1));
      return;
    }

    if (event.target.closest("#add-to-cart-btn")) handleAddToCart();
  });

  // Wishlist changes (this tab or another tab) update the label
  window.addEventListener("luxewear:storage-change", updateWishlistLabel);
  window.addEventListener("luxewear:storage-change-external", updateWishlistLabel);
}

/* ---------------------------------------------------------------------
   7. Related products and "not found"
   ------------------------------------------------------------------ */
function renderRelated(product) {
  const related = getRelatedProducts(product.id, 4);
  const section = document.getElementById("related-section");
  if (related.length === 0) {
    if (section) section.classList.add("hidden");
    return;
  }
  renderProductGrid(document.getElementById("related-grid"), related);
}

function showNotFound() {
  document.title = "Product Not Found – LuxeWear";

  const box = document.getElementById("breadcrumb");
  if (box) box.innerHTML = '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <span>Not found</span>';

  document.getElementById("product-detail").innerHTML =
    '<div class="empty-state"><i class="fa-regular fa-face-frown"></i>' +
    "<h3>Product not found</h3>" +
    "<p>The product you are looking for does not exist or may have been removed.</p>" +
    '<a href="shop.html" class="btn btn-primary">Back to Shop</a></div>';

  const section = document.getElementById("related-section");
  if (section) section.classList.add("hidden");
}

// Highlight the product's category in the navbar (e.g. "Women").
function highlightCategoryLink(product) {
  const link = document.querySelector('.nav-links a[href="' + product.category + '.html"]');
  if (link) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
}

/* ---------------------------------------------------------------------
   8. Start
   ------------------------------------------------------------------ */
onReady(function () {
  const product = getProductById(getQueryParam("id"));

  if (!product) {
    showNotFound();
    return;
  }

  currentProduct = product;
  detailState.size = product.sizes[0];
  detailState.color = product.colors[0].name;
  detailState.qty = 1;

  document.title = product.name + " – LuxeWear";
  renderBreadcrumb(product);
  renderProductDetail(product);
  highlightCategoryLink(product);

  initGalleryZoom();
  initDetailEvents();
  setQuantity(1);

  // The wishlist button was just created, so sync its heart and label now.
  syncWishlistButtons();
  updateWishlistLabel();

  renderRelated(product);
});