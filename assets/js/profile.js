/* =====================================================================
   LuxeWear – profile.js
   Powers profile.html: shows the logged-in demo user, saves profile
   edits, lists orders and handles logout.

   Orders belong to a user when order.userEmail matches the user's email
   (checkout.js will save that field in Stage 9).
   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

let profileUser = null;

// Safely put plain text into an element by id.
function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

/* ---------------------------------------------------------------------
   1. Access control
   ------------------------------------------------------------------ */
function requireLogin() {
  if (isLoggedIn()) return true;
  window.location.replace("login.html?redirect=profile.html");
  return false;
}

/* ---------------------------------------------------------------------
   2. Orders
   ------------------------------------------------------------------ */
function getUserOrders(user) {
  return getOrders().filter(function (order) {
    return order && typeof order === "object" && order.userEmail === user.email;
  });
}

function orderCardHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(function (sum, item) { return sum + (Number(item.qty) || 0); }, 0);
  const reference = String(order.reference || "");
  const status = order.status || "Confirmed (demo)";

  return `
    <div class="order-card">
      <div>
        <strong>${escapeHTML(reference)}</strong>
        <small>${escapeHTML(formatDate(order.date))} &middot; ${itemCount} ${itemCount === 1 ? "item" : "items"}</small>
      </div>
      <strong>${formatPrice(order.total)}</strong>
      <span class="status-pill">${escapeHTML(status)}</span>
      <a class="link-gold" href="order-confirmation.html?ref=${encodeURIComponent(reference)}">View</a>
    </div>`;
}

function renderOrders() {
  const list = document.getElementById("orders-list");
  if (!list) return;

  const orders = getUserOrders(profileUser);
  setText("profile-orders-count", "Orders placed: " + orders.length);

  if (orders.length === 0) {
    list.innerHTML =
      '<div class="empty-state" style="padding: 30px 10px;"><i class="fa-solid fa-box-open"></i>' +
      "<h3>No orders yet</h3><p>Your demo orders will appear here.</p>" +
      '<a href="shop.html" class="btn btn-primary btn-sm">Start Shopping</a></div>';
    return;
  }
  list.innerHTML = orders.map(orderCardHtml).join("");
}

/* ---------------------------------------------------------------------
   3. Profile card and form
   ------------------------------------------------------------------ */
function renderProfileCard() {
  const label = String(profileUser.name || profileUser.email || "?").trim();
  setText("profile-avatar", label.charAt(0).toUpperCase());
  setText("profile-name", profileUser.name || "LuxeWear Customer");
  setText("profile-email", profileUser.email);
  setText("profile-joined", profileUser.joined ? "Member since " + formatDate(profileUser.joined) : "");
}

function fillProfileForm() {
  document.getElementById("profile-name-input").value = profileUser.name || "";
  document.getElementById("profile-email-input").value = profileUser.email || "";
  document.getElementById("profile-phone").value = profileUser.phone || "";
  document.getElementById("profile-city").value = profileUser.city || "";
  document.getElementById("profile-address").value = profileUser.address || "";
}

function validateProfileForm(fields) {
  let valid = true;

  const name = fields.name.value.replace(/\s+/g, " ").trim();
  if (name.length < 2) {
    setFieldError(fields.name, "Please enter your name (at least 2 characters).");
    valid = false;
  } else {
    setFieldSuccess(fields.name);
  }

  // Phone is optional, but must look right if it is filled in
  const phone = fields.phone.value.trim();
  if (phone && !isValidPhone(phone)) {
    setFieldError(fields.phone, "Please enter a valid phone number (7 to 15 digits).");
    valid = false;
  } else {
    clearFieldState(fields.phone);
  }

  return valid;
}

function initProfileForm() {
  const form = document.getElementById("profile-form");
  const fields = {
    name: document.getElementById("profile-name-input"),
    phone: document.getElementById("profile-phone"),
    city: document.getElementById("profile-city"),
    address: document.getElementById("profile-address")
  };

  Object.keys(fields).forEach(function (key) {
    fields[key].addEventListener("input", function () { clearFieldState(fields[key]); });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateProfileForm(fields)) {
      const bad = form.querySelector(".has-error .form-control");
      if (bad) bad.focus();
      return;
    }

    const saved = updateCurrentUser({
      name: fields.name.value.replace(/\s+/g, " ").trim(),
      phone: fields.phone.value.trim(),
      city: fields.city.value.trim(),
      address: fields.address.value.trim()
    });

    if (!saved) {
      showToast("Could not save your changes. Please try again.", "error");
      return;
    }

    profileUser = getCurrentUser();
    renderProfileCard();
    fillProfileForm();
    form.querySelectorAll(".form-group").forEach(function (group) {
      group.classList.remove("has-success");
    });
    showToast("Profile updated successfully", "success");
  });
}

/* ---------------------------------------------------------------------
   4. Logout
   ------------------------------------------------------------------ */
function initLogout() {
  const button = document.getElementById("logout-btn");
  if (!button) return;

  button.addEventListener("click", function () {
    clearSession();
    window.location.href = "index.html";
  });
}

/* ---------------------------------------------------------------------
   5. Start
   ------------------------------------------------------------------ */
onReady(function () {
  if (!requireLogin()) return;

  profileUser = getCurrentUser();
  renderProfileCard();
  fillProfileForm();
  renderOrders();
  initProfileForm();
  initLogout();

  // The page stays hidden until we know the visitor is logged in
  document.getElementById("profile-root").classList.remove("hidden");

  // Logged out in another tab? Leave this page.
  window.addEventListener("luxewear:storage-change-external", function () {
    if (!isLoggedIn()) window.location.replace("login.html?redirect=profile.html");
  });
});