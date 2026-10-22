/* =====================================================================
   LuxeWear – common.js
   Shared UI used on every page. Load order:
   products.js -> storage.js -> common.js -> [page script] -> animations.js

   Every page needs these placeholders:
     <div id="site-header"></div>      (replaced by announcement bar + navbar)
     <footer id="site-footer"></footer> (filled with the footer)
   and <body data-page="..."> so the active nav link can be highlighted.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Small utilities (used by many files)
   ------------------------------------------------------------------ */

// Run a function when the page is ready (works even if the DOM is already loaded).
function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// True if the visitor asked their system to reduce motion.
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Make text safe to place inside HTML (always use this for user-typed text).
function escapeHTML(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return text.replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

// Read a value from the URL, e.g. product-details.html?id=5 -> getQueryParam("id") = "5".
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Wait until the user stops typing before running a function.
function debounce(callback, wait) {
  let timer = null;
  return function () {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { callback.apply(null, args); }, wait);
  };
}

// "men" -> "Men"
function capitalize(text) {
  text = String(text || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ISO date string -> "Oct 20, 2026"
function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ---------------------------------------------------------------------
   2. Validation helpers and form error display
   Works with markup like:
   <div class="form-group"><label>..</label><input class="form-control"><span class="form-error"></span></div>
   ------------------------------------------------------------------ */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

// Accepts digits, spaces, dashes, brackets and a leading "+". 7 to 15 digits.
function isValidPhone(phone) {
  const text = String(phone || "").trim();
  const digits = text.replace(/\D/g, "");
  return /^[+\d][\d\s\-()]*$/.test(text) && digits.length >= 7 && digits.length <= 15;
}

// Show a red error message under an input and shake the field.
function setFieldError(input, message) {
  const group = input.closest(".form-group");
  if (!group) return;

  group.classList.remove("has-success");
  group.classList.add("has-error");

  let errorBox = group.querySelector(".form-error");
  if (!errorBox) {
    errorBox = document.createElement("span");
    errorBox.className = "form-error";
    group.appendChild(errorBox);
  }
  errorBox.textContent = message;
  input.setAttribute("aria-invalid", "true");

  group.classList.remove("shake");
  void group.offsetWidth; // forces the browser to restart the animation
  group.classList.add("shake");
  group.addEventListener("animationend", function () { group.classList.remove("shake"); }, { once: true });
}

// Mark an input as valid (green border, no message).
function setFieldSuccess(input) {
  const group = input.closest(".form-group");
  if (!group) return;
  group.classList.remove("has-error");
  group.classList.add("has-success");
  input.removeAttribute("aria-invalid");
}

// Remove any error/success state (e.g. while the user is typing).
function clearFieldState(input) {
  const group = input.closest(".form-group");
  if (!group) return;
  group.classList.remove("has-error", "has-success");
  input.removeAttribute("aria-invalid");
}

/* ---------------------------------------------------------------------
   3. Toast notifications
   type: "success" | "error" | "info"
   ------------------------------------------------------------------ */
function showToast(message, type) {
  type = type || "success";

  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  // Keep at most 3 toasts on screen
  while (container.children.length >= 3) {
    container.removeChild(container.firstChild);
  }

  const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" };

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("i");
  icon.className = "fa-solid " + (icons[type] || icons.info);
  const text = document.createElement("span");
  text.textContent = message; // textContent keeps this safe from HTML injection

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("hide");
    setTimeout(function () { toast.remove(); }, 350);
  }, 3200);
}

/* ---------------------------------------------------------------------
   4. Product card rendering (shared by every page that lists products)
   ------------------------------------------------------------------ */

// 4.6 -> five star icons (full, half or empty)
function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
    } else if (rating >= i - 0.5) {
      html += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
    } else {
      html += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
    }
  }
  return html;
}

// Returns the HTML string for one product card.
function renderProductCard(product) {
  const name = escapeHTML(product.name);
  const url = "product-details.html?id=" + product.id;

  // One badge only: sale > new > best seller
  let badge = "";
  if (product.oldPrice) {
    const percent = Math.round((1 - product.price / product.oldPrice) * 100);
    badge = '<span class="product-badge sale">-' + percent + "%</span>";
  } else if (product.newArrival) {
    badge = '<span class="product-badge new">New</span>';
  } else if (product.bestSeller) {
    badge = '<span class="product-badge">Best Seller</span>';
  }

  const oldPrice = product.oldPrice
    ? '<span class="price-old">' + formatPrice(product.oldPrice) + "</span>"
    : "";

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image">
        ${badge}
        <button type="button" class="wishlist-btn" data-action="wishlist" data-id="${product.id}"
                aria-label="Toggle ${name} in wishlist" aria-pressed="false">
          <i class="fa-regular fa-heart"></i>
        </button>
        <a href="${url}" aria-label="View ${name}">
          <img class="img-main" src="${product.image}" alt="${name}" loading="lazy" width="800" height="1000">
          <img class="img-hover" src="${product.hoverImage}" alt="" loading="lazy" width="800" height="1000">
        </a>
        <div class="quick-actions">
          <button type="button" class="btn btn-primary" data-action="add-to-cart" data-id="${product.id}">
            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${capitalize(product.category)} &middot; ${capitalize(product.type)}</p>
        <h3 class="product-name"><a href="${url}">${name}</a></h3>
        <div class="product-rating" title="Rated ${product.rating} out of 5">
          ${renderStars(product.rating)} <span>(${product.rating.toFixed(1)})</span>
        </div>
        <p class="price">${formatPrice(product.price)}${oldPrice}</p>
      </div>
    </article>`;
}

// Fill a container with product cards (or an empty message), then refresh heart icons.
// options.emptyHtml lets a page supply its own "nothing here" markup.
function renderProductGrid(container, products, options) {
  if (!container) return;
  options = options || {};

  if (!products || products.length === 0) {
    container.innerHTML = options.emptyHtml ||
      '<div class="empty-state"><i class="fa-regular fa-face-frown"></i>' +
      "<h3>No products found</h3><p>Try changing your search or filters.</p></div>";
    return;
  }

  container.innerHTML = products.map(renderProductCard).join("");

  // Staggered fade-in
  container.querySelectorAll(".product-card").forEach(function (card, index) {
    card.classList.add("rendered");
    card.style.animationDelay = Math.min(index, 11) * 50 + "ms";
  });

  syncWishlistButtons();
}

// Show grey shimmering placeholder cards while "loading".
function showSkeletons(container, count) {
  if (!container) return;
  count = count || 8;
  let html = "";
  for (let i = 0; i < count; i++) {
    html += '<div class="skeleton-card" aria-hidden="true">' +
            '<div class="skeleton skeleton-img"></div>' +
            '<div class="skeleton skeleton-line"></div>' +
            '<div class="skeleton skeleton-line short"></div></div>';
  }
  container.innerHTML = html;
}

/* ---------------------------------------------------------------------
   5. Counters, wishlist hearts and account link
   ------------------------------------------------------------------ */
const lastBadgeCounts = { cart: null, wishlist: null };

function setBadge(name, count) {
  document.querySelectorAll('[data-badge="' + name + '"]').forEach(function (badge) {
    badge.textContent = count > 0 ? (count > 99 ? "99+" : count) : "";
    badge.dataset.count = count;

    // Bump animation only when the number goes up (not on page load)
    if (lastBadgeCounts[name] !== null && count > lastBadgeCounts[name]) {
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
      badge.addEventListener("animationend", function () { badge.classList.remove("bump"); }, { once: true });
    }
  });
  lastBadgeCounts[name] = count;
}

function updateCounters() {
  setBadge("cart", getCartCount());
  setBadge("wishlist", getWishlist().length);
}

// Make every heart button match what is saved in the wishlist.
function syncWishlistButtons() {
  const saved = getWishlist();
  document.querySelectorAll('[data-action="wishlist"]').forEach(function (button) {
    const active = saved.indexOf(Number(button.dataset.id)) !== -1;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    const heart = button.querySelector(".fa-heart");
    if (heart) {
      heart.classList.toggle("fa-solid", active);
      heart.classList.toggle("fa-regular", !active);
    }
  });
}

// Logged in -> profile page. Logged out -> login page.
function getAccountHref() {
  return isLoggedIn() ? "profile.html" : "login.html";
}

function updateAccountLink() {
  const loggedIn = isLoggedIn();
  document.querySelectorAll("[data-account-link]").forEach(function (link) {
    link.setAttribute("href", getAccountHref());
    if (link.classList.contains("icon-btn")) {
      link.setAttribute("aria-label", loggedIn ? "My profile" : "Log in");
      link.setAttribute("title", loggedIn ? "My profile" : "Log in");
    }
  });
}

/* ---------------------------------------------------------------------
   6. Header (announcement bar + navbar) and footer
   ------------------------------------------------------------------ */
const NAV_LINKS = [
  { label: "Home",  href: "index.html",   page: "home" },
  { label: "Shop",  href: "shop.html",    page: "shop" },
  { label: "Men",   href: "men.html",     page: "men" },
  { label: "Women", href: "women.html",   page: "women" },
  { label: "Kids",  href: "kids.html",    page: "kids" },
  { label: "About", href: "about.html",   page: "about" },
  { label: "Contact", href: "contact.html", page: "contact" }
];

const ANNOUNCEMENT_KEY = "luxewear_announcement_closed";

function isAnnouncementClosed() {
  try { return sessionStorage.getItem(ANNOUNCEMENT_KEY) === "1"; } catch (e) { return false; }
}

function renderHeader() {
  const placeholder = document.getElementById("site-header");
  if (!placeholder) return;

  const currentPage = document.body.dataset.page || "";

  const linksHtml = NAV_LINKS.map(function (link) {
    const active = link.page === currentPage;
    return '<a href="' + link.href + '"' + (active ? ' class="active" aria-current="page"' : "") + ">" + link.label + "</a>";
  }).join("");

  const announcementHtml = isAnnouncementClosed() ? "" : `
    <div class="announcement-bar" id="announcement-bar">
      <span>Free shipping on orders over <strong>$${FREE_SHIPPING_THRESHOLD}</strong> &middot; New arrivals every week</span>
      <button type="button" class="announcement-close" id="announcement-close" aria-label="Close announcement">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`;

  const headerHtml = `
    <header class="site-header">
      <div class="container navbar">
        <a href="index.html" class="nav-logo" aria-label="LuxeWear home">Luxe<span>Wear</span></a>

        <nav class="nav-links" id="nav-links" aria-label="Main navigation">${linksHtml}</nav>

        <div class="nav-actions">
          <button type="button" class="icon-btn" id="search-toggle" aria-label="Search products" aria-expanded="false">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
          <a href="${getAccountHref()}" class="icon-btn" data-account-link aria-label="Account">
            <i class="fa-regular fa-user"></i>
          </a>
          <a href="wishlist.html" class="icon-btn" aria-label="Wishlist">
            <i class="fa-regular fa-heart"></i><span class="badge" data-badge="wishlist"></span>
          </a>
          <a href="cart.html" class="icon-btn" aria-label="Shopping cart">
            <i class="fa-solid fa-bag-shopping"></i><span class="badge" data-badge="cart"></span>
          </a>
          <button type="button" class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div class="nav-search" id="nav-search">
        <div class="container">
          <form id="nav-search-form" role="search">
            <label for="nav-search-input" class="sr-only">Search products</label>
            <input type="search" id="nav-search-input" placeholder="Search for dresses, sneakers, watches..." autocomplete="off">
            <button type="submit" class="btn btn-primary btn-sm">Search</button>
          </form>
        </div>
      </div>

      <div class="nav-overlay" id="nav-overlay"></div>
    </header>`;

  // Replace the placeholder so the sticky header is a direct child of <body>.
  placeholder.insertAdjacentHTML("beforebegin", announcementHtml + headerHtml);
  placeholder.remove();

  const closeButton = document.getElementById("announcement-close");
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      const bar = document.getElementById("announcement-bar");
      if (bar) bar.remove();
      try { sessionStorage.setItem(ANNOUNCEMENT_KEY, "1"); } catch (e) { /* ignore */ }
    });
  }
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  footer.classList.add("site-footer");
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo">Luxe<span>Wear</span></a>
          <p>Timeless fashion for the modern wardrobe. Thoughtfully designed pieces for men, women and kids.</p>
          <div class="social-links">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest"><i class="fa-brands fa-pinterest-p"></i></a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="shop.html">All Products</a></li>
            <li><a href="men.html">Men</a></li>
            <li><a href="women.html">Women</a></li>
            <li><a href="kids.html">Kids</a></li>
            <li><a href="wishlist.html">Wishlist</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="contact.html">Contact Us</a></li>
            <li><a href="${getAccountHref()}" data-account-link>My Account</a></li>
            <li><a href="cart.html">Shopping Cart</a></li>
          </ul>
        </div>

        <div class="footer-col footer-newsletter">
          <h4>Newsletter</h4>
          <p>Get early access to new arrivals and offers.</p>
          <form class="newsletter-form" data-newsletter novalidate>
            <label for="footer-newsletter-email" class="sr-only">Email address</label>
            <input type="email" id="footer-newsletter-email" placeholder="Your email address" autocomplete="email">
            <button type="submit" class="btn btn-gold btn-sm">Join</button>
          </form>
          <p class="newsletter-message" role="status"></p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} LuxeWear. Academic demo project, no real orders or payments.</p>
        <p>Demo data is stored only in your browser.</p>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------
   7. Mobile menu and search drop-down
   ------------------------------------------------------------------ */
function initNavigation() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const overlay = document.getElementById("nav-overlay");
  if (!hamburger || !navLinks || !overlay) return;

  function setMenu(open) {
    hamburger.classList.toggle("open", open);
    navLinks.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  }

  hamburger.addEventListener("click", function () {
    setMenu(!navLinks.classList.contains("open"));
  });
  overlay.addEventListener("click", function () { setMenu(false); });
  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) setMenu(false);
  });
}

function initSearch() {
  const toggle = document.getElementById("search-toggle");
  const panel = document.getElementById("nav-search");
  const form = document.getElementById("nav-search-form");
  const input = document.getElementById("nav-search-input");
  if (!toggle || !panel || !form || !input) return;

  // Pre-fill with the current search (when we are on shop.html?search=...)
  input.value = getQueryParam("search") || "";

  function setSearch(open) {
    panel.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(function () { input.focus(); }, 150);
  }

  toggle.addEventListener("click", function () {
    setSearch(!panel.classList.contains("open"));
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setSearch(false);
  });

  // Searching always goes to the shop page, which reads ?search=
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const query = input.value.trim();
    window.location.href = query ? "shop.html?search=" + encodeURIComponent(query) : "shop.html";
  });
}

/* ---------------------------------------------------------------------
   8. Newsletter forms (footer + home page): any <form data-newsletter>
   ------------------------------------------------------------------ */
function initNewsletterForms() {
  document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
    const input = form.querySelector('input[type="email"]');
    if (!input) return;

    // The message paragraph should directly follow the form; create it if missing.
    let message = form.nextElementSibling;
    if (!message || !message.classList.contains("newsletter-message")) {
      message = document.createElement("p");
      message.className = "newsletter-message";
      message.setAttribute("role", "status");
      form.insertAdjacentElement("afterend", message);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const email = input.value.trim();
      message.className = "newsletter-message";

      if (!isValidEmail(email)) {
        message.textContent = "Please enter a valid email address.";
        message.classList.add("error");
        input.focus();
        return;
      }

      if (subscribeNewsletter(email)) {
        message.textContent = "Thank you for subscribing to LuxeWear!";
        message.classList.add("success");
        form.reset();
        showToast("Subscribed to the newsletter", "success");
      } else {
        message.textContent = "Could not subscribe. This email may already be subscribed.";
        message.classList.add("error");
      }
    });
  });
}

/* ---------------------------------------------------------------------
   9. Global click handling for product cards
   Buttons marked data-action="wishlist" or data-action="add-to-cart"
   (with data-id) work on every page, including cards rendered later.
   The product details page uses its own add-to-cart button instead.
   ------------------------------------------------------------------ */
function handleWishlistClick(button, productId) {
  const product = getProductById(productId);
  if (!product) return;

  const added = toggleWishlist(productId); // also refreshes hearts + counters
  button.classList.remove("pop");
  void button.offsetWidth;
  button.classList.add("pop");
  button.addEventListener("animationend", function () { button.classList.remove("pop"); }, { once: true });

  showToast(product.name + (added ? " added to wishlist" : " removed from wishlist"), added ? "success" : "info");
}

function handleAddToCartClick(button, productId) {
  const product = getProductById(productId);
  if (!product) return;

  // Quick add uses the first size and color. Pick others on the details page.
  const item = addToCart(productId);
  if (!item) return;
  showToast(product.name + " (" + item.size + ", " + item.color + ") added to cart", "success");

  if (!button.classList.contains("added")) {
    const originalHtml = button.innerHTML;
    button.classList.add("added");
    button.innerHTML = '<i class="fa-solid fa-check"></i> Added';
    setTimeout(function () {
      button.classList.remove("added");
      button.innerHTML = originalHtml;
    }, 1400);
  }
}

function initGlobalClicks() {
  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;

    const action = trigger.dataset.action;
    const productId = Number(trigger.dataset.id);

    if (action === "wishlist") {
      handleWishlistClick(trigger, productId);
    } else if (action === "add-to-cart") {
      handleAddToCartClick(trigger, productId);
    }
  });
}

/* ---------------------------------------------------------------------
   10. Broken image fallback
   If any image fails to load, show a simple LuxeWear placeholder instead.
   ------------------------------------------------------------------ */
const FALLBACK_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">' +
  '<rect width="800" height="1000" fill="#eadfca"/>' +
  '<text x="400" y="510" text-anchor="middle" font-family="Georgia, serif" font-size="56" fill="#a8842f">LuxeWear</text></svg>'
);

// "error" events do not bubble, so we listen in the capture phase (third argument true).
document.addEventListener("error", function (event) {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "true";

  // The hover image sits on top of the main one, so just hide it if it fails.
  if (img.classList.contains("img-hover")) {
    img.style.display = "none";
    return;
  }
  img.src = FALLBACK_IMAGE;
}, true);

/* ---------------------------------------------------------------------
   11. Start everything
   ------------------------------------------------------------------ */
onReady(function () {
  renderHeader();
  renderFooter();
  initNavigation();
  initSearch();
  initNewsletterForms();
  initGlobalClicks();
  updateCounters();
  syncWishlistButtons();
  updateAccountLink();
});

// Any change to cart / wishlist / session refreshes the shared UI.
window.addEventListener("luxewear:storage-change", function () {
  updateCounters();
  syncWishlistButtons();
  updateAccountLink();
});

// Changes made in another browser tab.
window.addEventListener("storage", function () {
  updateCounters();
  syncWishlistButtons();
  updateAccountLink();
  window.dispatchEvent(new CustomEvent("luxewear:storage-change-external"));
});