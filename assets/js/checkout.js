/* =====================================================================
   LuxeWear – checkout.js
   Powers checkout.html AND order-confirmation.html (it checks which page
   it is on using <body data-page="...">).

   DEMO ONLY: no payment is taken and no real order is created. The form
   collects made-up contact/shipping details only. Never ask for card
   numbers or other sensitive data in this project.

   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

const CURRENT_PAGE = document.body.dataset.page;

let orderPlaced = false; // true once the order is saved (stops re-rendering)
let processing = false;  // true while the "processing" delay runs (blocks double clicks)

/* ---------------------------------------------------------------------
   1. Order helpers
   ------------------------------------------------------------------ */

// Random characters without look-alikes (no 0/O or 1/I).
const REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomReferenceCode(length) {
  let code = "";
  const values = new Uint32Array(length);

  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) values[i] = Math.floor(Math.random() * 4294967296);
  }
  for (let i = 0; i < length; i++) {
    code += REFERENCE_CHARS.charAt(values[i] % REFERENCE_CHARS.length);
  }
  return code;
}

// Example: "LW-7KQ4ZM". Tries again in the (very unlikely) case it already exists.
function generateOrderReference() {
  let reference;
  let attempts = 0;
  do {
    reference = "LW-" + randomReferenceCode(6);
    attempts++;
  } while (getOrderByRef(reference) && attempts < 20);
  return reference;
}

// Round to 2 decimals so floating point never leaves values like 38.990000001.
function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

// Turn the current cart + form values into one order object (a snapshot).
function buildOrder(summary, customer, user) {
  return {
    reference: generateOrderReference(),
    date: new Date().toISOString(),
    userEmail: user.email,
    customer: customer,
    items: summary.items.map(function (item) {
      return {
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        size: item.size,
        color: item.color,
        image: item.product.image
      };
    }),
    subtotal: roundMoney(summary.subtotal),
    shipping: roundMoney(summary.shipping),
    total: roundMoney(summary.total),
    status: "Confirmed (demo)"
  };
}

/* ---------------------------------------------------------------------
   2. Checkout page: summary box
   ------------------------------------------------------------------ */
function summaryItemHtml(item) {
  return `
    <div class="summary-item">
      <div>
        ${escapeHTML(item.product.name)} &times; ${item.qty}
        <small>Size ${escapeHTML(item.size)} &middot; ${escapeHTML(item.color)}</small>
      </div>
      <span>${formatPrice(item.lineTotal)}</span>
    </div>`;
}

function renderCheckoutSummary(summary) {
  const box = document.getElementById("checkout-summary");
  if (!box) return;

  const shippingText = summary.shipping === 0 ? "Free" : formatPrice(summary.shipping);

  box.innerHTML = `
    <h3>Order Summary</h3>
    ${summary.items.map(summaryItemHtml).join("")}
    <div class="summary-row" style="margin-top: 12px;"><span>Subtotal</span><span>${formatPrice(summary.subtotal)}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shippingText}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatPrice(summary.total)}</span></div>
    <p class="summary-note">Demo order: no payment is taken and nothing is shipped.</p>
    <a href="cart.html" class="link-gold">&larr; Edit cart</a>`;
}

// Show the form (cart has items) or the empty message (it does not).
function renderCheckoutPage() {
  const summary = getCartSummary();
  const root = document.getElementById("checkout-root");
  const empty = document.getElementById("checkout-empty");
  const subtitle = document.getElementById("checkout-subtitle");

  const hasItems = summary.items.length > 0;
  root.classList.toggle("hidden", !hasItems);
  empty.classList.toggle("hidden", hasItems);
  if (subtitle) {
    subtitle.textContent = hasItems
      ? "Enter your details to place a demo order."
      : "There is nothing to check out yet.";
  }
  if (hasItems) renderCheckoutSummary(summary);
}

/* ---------------------------------------------------------------------
   3. Checkout page: form
   Each field: id + a check function that returns an error message,
   or "" when the value is fine.
   ------------------------------------------------------------------ */
const CHECKOUT_FIELDS = [
  {
    id: "co-name",
    check: function (value) {
      return value.replace(/\s+/g, " ").trim().length >= 2 ? "" : "Please enter your full name.";
    }
  },
  {
    id: "co-email",
    check: function (value) {
      if (!value.trim()) return "Email address is required.";
      return isValidEmail(value) ? "" : "Please enter a valid email address.";
    }
  },
  {
    id: "co-phone",
    check: function (value) {
      if (!value.trim()) return "Phone number is required.";
      return isValidPhone(value) ? "" : "Please enter a valid phone number (7 to 15 digits).";
    }
  },
  {
    id: "co-address",
    check: function (value) {
      return value.trim().length >= 5 ? "" : "Please enter your street address.";
    }
  },
  {
    id: "co-city",
    check: function (value) {
      return value.trim().length >= 2 ? "" : "Please enter your city.";
    }
  },
  {
    id: "co-postal",
    check: function (value) {
      if (!value.trim()) return "Postal code is required.";
      return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(value.trim()) ? "" : "Please enter a valid postal code.";
    }
  },
  {
    id: "co-country",
    check: function (value) {
      return value ? "" : "Please select your country.";
    }
  }
];

// Check one field and show or clear its message. Returns true when valid.
function validateCheckoutField(field) {
  const input = document.getElementById(field.id);
  const message = field.check(input.value);

  if (message) {
    setFieldError(input, message);
    return false;
  }
  setFieldSuccess(input);
  return true;
}

// Pre-fill from the logged-in demo user's profile.
function prefillCheckoutForm(user) {
  const values = {
    "co-name": user.name,
    "co-email": user.email,
    "co-phone": user.phone,
    "co-address": user.address,
    "co-city": user.city
  };
  Object.keys(values).forEach(function (id) {
    const input = document.getElementById(id);
    if (input && values[id]) input.value = values[id];
  });
}

// Read every form value into one object (trimmed, extra spaces removed).
function readCustomerDetails() {
  function value(id) { return document.getElementById(id).value.replace(/\s+/g, " ").trim(); }
  return {
    name: value("co-name"),
    email: value("co-email").toLowerCase(),
    phone: value("co-phone"),
    address: value("co-address"),
    city: value("co-city"),
    postalCode: value("co-postal"),
    country: value("co-country"),
    notes: document.getElementById("co-notes").value.trim()
  };
}

/* ---------------------------------------------------------------------
   4. Checkout page: placing the (demo) order
   ------------------------------------------------------------------ */
function placeDemoOrder(button) {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace("login.html?redirect=checkout.html");
    return;
  }

  // Read the cart again at this moment so the order is always up to date
  const summary = getCartSummary();
  if (summary.items.length === 0) {
    processing = false;
    button.disabled = false;
    button.classList.remove("loading");
    showToast("Your cart is empty.", "error");
    renderCheckoutPage();
    return;
  }

  const order = buildOrder(summary, readCustomerDetails(), user);

  // Save first. Only clear the cart if saving worked.
  if (!saveOrder(order)) {
    processing = false;
    button.disabled = false;
    button.classList.remove("loading");
    showToast("Could not save your order. Please check that browser storage is enabled.", "error");
    return;
  }

  orderPlaced = true; // stops the summary re-rendering as "empty"
  clearCart();
  window.location.href = "order-confirmation.html?ref=" + encodeURIComponent(order.reference);
}

function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  const button = document.getElementById("place-order-btn");

  // Clear errors while typing, validate when leaving a filled field
  CHECKOUT_FIELDS.forEach(function (field) {
    const input = document.getElementById(field.id);
    input.addEventListener("input", function () { clearFieldState(input); });
    input.addEventListener("change", function () { if (input.value !== "") validateCheckoutField(field); });
    input.addEventListener("blur", function () { if (input.value !== "") validateCheckoutField(field); });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (processing || orderPlaced) return;

    // Check every field (no early exit) so all problems show together
    const results = CHECKOUT_FIELDS.map(validateCheckoutField);
    if (results.indexOf(false) !== -1) {
      const firstBad = form.querySelector(".has-error .form-control");
      if (firstBad) firstBad.focus();
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    processing = true;
    button.disabled = true;
    button.classList.add("loading");
    button.firstChild.textContent = "Processing... ";

    // Short delay to simulate processing (none for reduced-motion users)
    setTimeout(function () { placeDemoOrder(button); }, prefersReducedMotion() ? 0 : 1000);
  });
}

function startCheckoutPage() {
  // Checkout needs a logged-in demo user
  if (!isLoggedIn()) {
    window.location.replace("login.html?redirect=checkout.html");
    return;
  }

  prefillCheckoutForm(getCurrentUser());
  renderCheckoutPage();
  initCheckoutForm();

  // Cart or login changed in another tab
  function refresh() {
    if (orderPlaced || processing) return;
    if (!isLoggedIn()) {
      window.location.replace("login.html?redirect=checkout.html");
      return;
    }
    renderCheckoutPage();
  }
  window.addEventListener("luxewear:storage-change", refresh);
  window.addEventListener("luxewear:storage-change-external", refresh);
}

/* ---------------------------------------------------------------------
   5. Order confirmation page
   ------------------------------------------------------------------ */
function confirmationMessageHtml(icon, title, text, buttonHtml) {
  return `
    <div class="empty-state">
      <i class="${icon}"></i>
      <h3>${title}</h3>
      <p>${text}</p>
      ${buttonHtml}
    </div>`;
}

function confirmationItemHtml(item) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.price) || 0;
  return `
    <div class="summary-item">
      <div>
        ${escapeHTML(item.name)} &times; ${qty}
        <small>Size ${escapeHTML(item.size)} &middot; ${escapeHTML(item.color)}</small>
      </div>
      <span>${formatPrice(price * qty)}</span>
    </div>`;
}

function renderConfirmation() {
  const root = document.getElementById("confirmation-root");

  const user = getCurrentUser();
  if (!user) {
    root.innerHTML = confirmationMessageHtml(
      "fa-solid fa-lock", "Please log in",
      "Log in to view your demo order details.",
      '<a href="login.html" class="btn btn-primary">Log In</a>'
    );
    return;
  }

  // Only the user who placed the order can see it
  const reference = getQueryParam("ref");
  const order = reference ? getOrderByRef(reference) : null;

  if (!order || order.userEmail !== user.email) {
    root.innerHTML = confirmationMessageHtml(
      "fa-regular fa-face-frown", "Order not found",
      "We could not find that order. It may belong to a different account, or the demo data was reset.",
      '<a href="profile.html" class="btn btn-primary">View My Orders</a>'
    );
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const customer = order.customer || {};
  const shippingText = Number(order.shipping) === 0 ? "Free" : formatPrice(order.shipping);

  root.innerHTML = `
    <div class="confirmation-card">
      <div class="confirm-icon" aria-hidden="true"><i class="fa-solid fa-check"></i></div>
      <h1>Thank you, ${escapeHTML(String(customer.name || user.name || "").split(" ")[0] || "there")}!</h1>
      <p>Your demo order has been placed successfully.</p>
      <div class="order-ref">Order reference: ${escapeHTML(order.reference)}</div>

      <div class="alert alert-warning" role="note" style="text-align: left;">
        <strong>Demo order.</strong> No payment was taken and nothing will be shipped.
        This order is saved only in your browser.
      </div>

      <div class="confirmation-details">
        <h3>Items</h3>
        ${items.map(confirmationItemHtml).join("")}

        <div class="summary-row" style="margin-top: 12px;"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shippingText}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(order.total)}</span></div>

        <h3>Shipping to</h3>
        <address>
          ${escapeHTML(customer.name)}<br>
          ${escapeHTML(customer.address)}<br>
          ${escapeHTML(customer.city)} ${escapeHTML(customer.postalCode)}<br>
          ${escapeHTML(customer.country)}<br>
          ${escapeHTML(customer.phone)}
        </address>

        <h3>Order details</h3>
        <address>
          Placed on ${escapeHTML(formatDate(order.date))}<br>
          Status: ${escapeHTML(order.status || "Confirmed (demo)")}
          ${customer.notes ? "<br>Notes: " + escapeHTML(customer.notes) : ""}
        </address>
      </div>

      <div class="confirmation-actions">
        <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
        <a href="profile.html" class="btn btn-outline">View My Orders</a>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------
   6. Start
   ------------------------------------------------------------------ */
onReady(function () {
  if (CURRENT_PAGE === "checkout") {
    startCheckoutPage();
  } else if (CURRENT_PAGE === "order-confirmation") {
    renderConfirmation();
  }
});