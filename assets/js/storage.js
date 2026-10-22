/* =====================================================================
   LuxeWear – storage.js
   Safe LocalStorage helpers + cart / wishlist / user / order functions.
   Requires products.js to be loaded first.

   SECURITY NOTE (academic demo only):
   LocalStorage is NOT secure. Anything saved here, including demo
   passwords, can be read by anyone using this browser. Never enter real
   passwords, payment details or personal data. Real authentication needs
   a secure backend that hashes passwords.
   ===================================================================== */

/* ---------- Storage keys (one place to rename them) ---------- */
const STORAGE_KEYS = {
  users: "luxewear_users",
  session: "luxewear_session",
  sessionTemp: "luxewear_session_temp",
  cart: "luxewear_cart",
  wishlist: "luxewear_wishlist",
  orders: "luxewear_orders",
  messages: "luxewear_messages",
  newsletter: "luxewear_newsletter"
};

/* ---------- Shipping rules (used by cart and checkout) ---------- */
const FREE_SHIPPING_THRESHOLD = 150;
const SHIPPING_FEE = 9.99;
const MAX_QTY_PER_ITEM = 10;

/* ---------------------------------------------------------------------
   Low-level helpers
   ------------------------------------------------------------------ */

// Read JSON from LocalStorage. Returns `fallback` if missing or invalid.
function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("LuxeWear: could not read '" + key + "'.", error);
    return fallback;
  }
}

// Save any value as JSON. Returns true on success, false on failure.
function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("LuxeWear: could not save '" + key + "'.", error);
    return false;
  }
}

// Remove one key.
function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("LuxeWear: could not remove '" + key + "'.", error);
  }
}

// Read a value that must be an array. Anything else becomes [].
function getArray(key) {
  const data = getData(key, []);
  return Array.isArray(data) ? data : [];
}

// Tell the rest of the page that stored data changed (counters refresh).
function notifyStorageChange() {
  window.dispatchEvent(new CustomEvent("luxewear:storage-change"));
}

/* ---------------------------------------------------------------------
   Cart
   A cart item looks like: { id: 2, qty: 1, size: "M", color: "Black" }
   The same product with a different size/color is a separate line.
   ------------------------------------------------------------------ */

// Get the cart. Removes broken entries and entries for deleted products.
function getCart() {
  return getArray(STORAGE_KEYS.cart).filter(function (item) {
    return item && getProductById(item.id) && Number(item.qty) > 0;
  });
}

function saveCart(cart) {
  setData(STORAGE_KEYS.cart, cart);
  notifyStorageChange();
}

// Two items are the "same line" if id, size and color all match.
function isSameCartLine(a, b) {
  return a.id === b.id && a.size === b.size && a.color === b.color;
}

// Add a product to the cart. Size/color default to the first option.
function addToCart(productId, qty = 1, size = null, color = null) {
  const product = getProductById(productId);
  if (!product) return null;

  const newItem = {
    id: product.id,
    qty: Math.min(Math.max(parseInt(qty, 10) || 1, 1), MAX_QTY_PER_ITEM),
    size: size || product.sizes[0],
    color: color || product.colors[0].name
  };

  const cart = getCart();
  const existing = cart.find(function (item) { return isSameCartLine(item, newItem); });

  if (existing) {
    existing.qty = Math.min(existing.qty + newItem.qty, MAX_QTY_PER_ITEM);
  } else {
    cart.push(newItem);
  }
  saveCart(cart);
  return newItem;
}

// Change the quantity of one cart line (qty <= 0 removes it).
function updateCartQty(line, newQty) {
  let cart = getCart();
  const target = cart.find(function (item) { return isSameCartLine(item, line); });
  if (!target) return;

  if (newQty <= 0) {
    cart = cart.filter(function (item) { return !isSameCartLine(item, line); });
  } else {
    target.qty = Math.min(newQty, MAX_QTY_PER_ITEM);
  }
  saveCart(cart);
}

// Remove one cart line completely.
function removeFromCart(line) {
  const cart = getCart().filter(function (item) { return !isSameCartLine(item, line); });
  saveCart(cart);
}

// Empty the cart (used after a successful demo order).
function clearCart() {
  saveCart([]);
}

// Total number of items in the cart (for the navbar counter).
function getCartCount() {
  return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
}

// Full totals, shared by the cart page and the checkout page.
function getCartSummary() {
  const items = getCart().map(function (item) {
    const product = getProductById(item.id);
    return Object.assign({}, item, {
      product: product,
      lineTotal: product.price * item.qty
    });
  });

  const subtotal = items.reduce(function (sum, item) { return sum + item.lineTotal; }, 0);
  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const count = items.reduce(function (sum, item) { return sum + item.qty; }, 0);

  return { items: items, subtotal: subtotal, shipping: shipping, total: total, count: count };
}

/* ---------------------------------------------------------------------
   Wishlist (stores product IDs only)
   ------------------------------------------------------------------ */

function getWishlist() {
  return getArray(STORAGE_KEYS.wishlist).filter(function (id) {
    return getProductById(id);
  });
}

function saveWishlist(list) {
  setData(STORAGE_KEYS.wishlist, list);
  notifyStorageChange();
}

function isInWishlist(productId) {
  return getWishlist().indexOf(Number(productId)) !== -1;
}

// Add or remove a product. Returns true if it is now in the wishlist.
function toggleWishlist(productId) {
  const id = Number(productId);
  let list = getWishlist();
  let added;

  if (list.indexOf(id) !== -1) {
    list = list.filter(function (item) { return item !== id; });
    added = false;
  } else {
    list.push(id);
    added = true;
  }
  saveWishlist(list);
  return added;
}

function removeFromWishlist(productId) {
  const id = Number(productId);
  saveWishlist(getWishlist().filter(function (item) { return item !== id; }));
}

/* ---------------------------------------------------------------------
   Users and login session (DEMO ONLY, not secure)
   A user: { name, email, password, phone, address, city, joined }
   ------------------------------------------------------------------ */

function getUsers() {
  // Ignore broken entries so one bad record can never crash the site
  return getArray(STORAGE_KEYS.users).filter(function (user) {
    return user && typeof user === "object" && typeof user.email === "string";
  });
}

function saveUsers(users) {
  return setData(STORAGE_KEYS.users, users);
}

function findUserByEmail(email) {
  const clean = String(email || "").trim().toLowerCase();
  return getUsers().find(function (u) { return u.email === clean; }) || null;
}

// Create a demo user. Returns { ok, message }.
function registerUser(userData) {
  const email = String(userData.email || "").trim().toLowerCase();
  if (findUserByEmail(email)) {
    return { ok: false, message: "An account with this email already exists." };
  }
  const users = getUsers();
  users.push({
    name: String(userData.name || "").trim(),
    email: email,
    password: userData.password,
    phone: "",
    address: "",
    city: "",
    joined: new Date().toISOString()
  });
    if (!saveUsers(users)) {
    return { ok: false, message: "Could not save your account. Please check that browser storage is enabled." };
  }
  return { ok: true, message: "Account created." };
}

// Marker kept in sessionStorage (cleared when the tab closes) for logins
// where "Remember me" was NOT ticked.
const SESSION_TAB_FLAG = "luxewear_session_active";

// Save the logged-in user's email. This is how login state is remembered.
// remember = true  -> stays logged in until logout (default)
// remember = false -> logged out after the tab is closed
function setSession(email, remember) {
  const keep = remember !== false;
  setData(STORAGE_KEYS.session, String(email).trim().toLowerCase());
  try {
    if (keep) {
      removeData(STORAGE_KEYS.sessionTemp);
      sessionStorage.removeItem(SESSION_TAB_FLAG);
    } else {
      sessionStorage.setItem(SESSION_TAB_FLAG, "1");
      setData(STORAGE_KEYS.sessionTemp, true);
    }
  } catch (error) {
    /* sessionStorage unavailable: the login simply stays remembered */
  }
  notifyStorageChange();
}

function clearSession() {
  removeData(STORAGE_KEYS.session);
  removeData(STORAGE_KEYS.sessionTemp);
  try { sessionStorage.removeItem(SESSION_TAB_FLAG); } catch (error) { /* ignore */ }
  notifyStorageChange();
}

// Runs on every page load: a login saved without "Remember me" is removed
// once the tab it was created in has been closed.
function enforceSessionExpiry() {
  if (!getData(STORAGE_KEYS.sessionTemp, false)) return;

  let tabIsActive = true;
  try { tabIsActive = sessionStorage.getItem(SESSION_TAB_FLAG) === "1"; } catch (error) { /* keep login */ }

  if (!tabIsActive) {
    removeData(STORAGE_KEYS.session);
    removeData(STORAGE_KEYS.sessionTemp);
  }
}
enforceSessionExpiry();

// Returns the logged-in user object, or null.
function getCurrentUser() {
  const email = getData(STORAGE_KEYS.session, null);
  return email ? findUserByEmail(email) : null;
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Update fields of the logged-in user (profile page). Returns true if saved.
function updateCurrentUser(changes) {
  const current = getCurrentUser();
  if (!current) return false;
  const users = getUsers().map(function (u) {
    return u.email === current.email ? Object.assign({}, u, changes, { email: u.email }) : u;
  });
  return saveUsers(users);
}

/* ---------------------------------------------------------------------
   Orders, contact messages and newsletter
   ------------------------------------------------------------------ */

function getOrders() {
  return getArray(STORAGE_KEYS.orders);
}

// Save a new order at the front of the history list.
function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  return setData(STORAGE_KEYS.orders, orders);
}

function getOrderByRef(reference) {
  return getOrders().find(function (o) { return o.reference === reference; }) || null;
}

function saveContactMessage(message) {
  const messages = getArray(STORAGE_KEYS.messages);
  messages.unshift(Object.assign({}, message, { date: new Date().toISOString() }));
  return setData(STORAGE_KEYS.messages, messages);
}

// Returns false if the email is already subscribed.
function subscribeNewsletter(email) {
  const clean = String(email || "").trim().toLowerCase();
  const list = getArray(STORAGE_KEYS.newsletter);
  if (list.indexOf(clean) !== -1) return false;
  list.push(clean);
  return setData(STORAGE_KEYS.newsletter, list);
}

/* ---------------------------------------------------------------------
   Reset all demo data (also handy from the browser console)
   ------------------------------------------------------------------ */
function resetAllDemoData() {
  Object.keys(STORAGE_KEYS).forEach(function (name) {
    removeData(STORAGE_KEYS[name]);
  });
  notifyStorageChange();
}