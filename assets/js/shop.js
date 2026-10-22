/* =====================================================================
   LuxeWear – shop.js
   Powers shop.html, men.html, women.html and kids.html.

   - shop.html has no data-category on <body>, so it shows all categories.
   - men/women/kids pages set <body data-category="men"> etc., which
     locks the category.

   URL parameters understood (also used by links on the home page and
   by the navbar search):
     ?category=men|women|kids   ?type=clothing|shoes|accessories
     ?sale=1                    ?search=dress
     ?sort=popularity           (see SORT_OPTIONS below)

   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

const VALID_CATEGORIES = ["men", "women", "kids"];
const VALID_TYPES = ["clothing", "shoes", "accessories"];
const SORT_OPTIONS = ["default", "price-asc", "price-desc", "popularity", "rating"];

// A page can lock the category using <body data-category="men">.
const LOCKED_CATEGORY = (function () {
  const value = document.body.dataset.category;
  return VALID_CATEGORIES.indexOf(value) !== -1 ? value : null;
})();

// Current filter choices. Everything on the page is rendered from this object.
const shopState = {
  category: LOCKED_CATEGORY || "all",
  type: "all",
  sale: false,
  search: "",
  sort: "default"
};

/* ---------------------------------------------------------------------
   1. Read the starting state from the URL (with validation)
   ------------------------------------------------------------------ */
function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const category = params.get("category");
  if (!LOCKED_CATEGORY && VALID_CATEGORIES.indexOf(category) !== -1) {
    shopState.category = category;
  }

  const type = params.get("type");
  if (VALID_TYPES.indexOf(type) !== -1) shopState.type = type;

  shopState.sale = params.get("sale") === "1";
  shopState.search = (params.get("search") || "").trim();

  const sort = params.get("sort");
  if (SORT_OPTIONS.indexOf(sort) !== -1) shopState.sort = sort;
}

// Keep the address bar in sync so a filtered page can be bookmarked or shared.
function updateUrl() {
  const params = new URLSearchParams();
  if (!LOCKED_CATEGORY && shopState.category !== "all") params.set("category", shopState.category);
  if (shopState.type !== "all") params.set("type", shopState.type);
  if (shopState.sale) params.set("sale", "1");
  if (shopState.search) params.set("search", shopState.search);
  if (shopState.sort !== "default") params.set("sort", shopState.sort);

  const query = params.toString();
  try {
    history.replaceState(null, "", window.location.pathname + (query ? "?" + query : ""));
  } catch (error) {
    /* Some browsers block this on file:// pages. The page still works. */
  }
}

/* ---------------------------------------------------------------------
   2. Searching
   ------------------------------------------------------------------ */

// Does one search word match the start of any word in the product text?
// "watches" is also tried as "watche" and "watch", so plurals work.
function wordMatches(term, words) {
  const variants = [term];
  if (term.length > 3 && term.slice(-2) === "es") variants.push(term.slice(0, -2));
  if (term.length > 2 && term.slice(-1) === "s") variants.push(term.slice(0, -1));

  return words.some(function (word) {
    return variants.some(function (variant) { return word.indexOf(variant) === 0; });
  });
}

// Every search word must match the product's name, category or type.
function matchesSearch(product, query) {
  if (!query) return true;

  const text = (product.name + " " + product.category + " " + product.type).toLowerCase();
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return terms.every(function (term) { return wordMatches(term, words); });
}

/* ---------------------------------------------------------------------
   3. Filtering and sorting
   ------------------------------------------------------------------ */

// Apply every filter except the category/type chips counts (used for results).
function getFilteredProducts() {
  let list = PRODUCTS.filter(function (product) {
    if (shopState.category !== "all" && product.category !== shopState.category) return false;
    if (shopState.type !== "all" && product.type !== shopState.type) return false;
    if (shopState.sale && !product.oldPrice) return false;
    return matchesSearch(product, shopState.search);
  });

  // slice() makes a copy so PRODUCTS itself is never re-ordered
  list = list.slice();

  switch (shopState.sort) {
    case "price-asc":
      list.sort(function (a, b) { return a.price - b.price; });
      break;
    case "price-desc":
      list.sort(function (a, b) { return b.price - a.price; });
      break;
    case "popularity":
      list.sort(function (a, b) { return b.popularity - a.popularity; });
      break;
    case "rating":
      list.sort(function (a, b) { return b.rating - a.rating; });
      break;
    default:
      break; // "default" keeps the order from products.js
  }
  return list;
}

/* ---------------------------------------------------------------------
   4. Rendering
   ------------------------------------------------------------------ */

// Build one filter chip button.
function chipHtml(label, filter, value, isActive, extraClass) {
  return '<button type="button" class="filter-chip' + (isActive ? " active" : "") + (extraClass || "") + '"' +
         ' data-filter="' + filter + '" data-value="' + value + '"' +
         ' aria-pressed="' + isActive + '">' + label + "</button>";
}

function renderFilterChips() {
  const categoryBar = document.getElementById("filter-category");
  if (categoryBar) {
    categoryBar.innerHTML =
      chipHtml("All", "category", "all", shopState.category === "all") +
      VALID_CATEGORIES.map(function (category) {
        return chipHtml(capitalize(category), "category", category, shopState.category === category);
      }).join("");
  }

  const typeBar = document.getElementById("filter-type");
  if (typeBar) {
    typeBar.innerHTML =
      chipHtml("All Types", "type", "all", shopState.type === "all") +
      VALID_TYPES.map(function (type) {
        return chipHtml(capitalize(type), "type", type, shopState.type === type);
      }).join("") +
      chipHtml('<i class="fa-solid fa-tag"></i> On Sale', "sale", "toggle", shopState.sale);
  }
}

// Text above the grid, e.g. 'Showing 6 products for "dress"'.
function renderResultsCount(count) {
  const box = document.getElementById("results-count");
  if (!box) return;

  let text = "Showing " + count + (count === 1 ? " product" : " products");
  if (shopState.search) text += ' for "' + shopState.search + '"';
  box.textContent = text;
}

function hasActiveFilters() {
  return (!LOCKED_CATEGORY && shopState.category !== "all") ||
         shopState.type !== "all" || shopState.sale ||
         shopState.search !== "" || shopState.sort !== "default";
}

function renderShop() {
  const products = getFilteredProducts();

  const emptyHtml =
    '<div class="empty-state"><i class="fa-regular fa-face-frown"></i>' +
    "<h3>No products found</h3>" +
    "<p>We could not find anything that matches your search or filters.</p>" +
    '<button type="button" class="btn btn-primary" data-clear-filters>Clear Filters</button></div>';

  renderProductGrid(document.getElementById("product-grid"), products, { emptyHtml: emptyHtml });
  renderFilterChips();
  renderResultsCount(products.length);
  updateUrl();
}

// Reset everything except the locked category.
function clearFilters() {
  shopState.category = LOCKED_CATEGORY || "all";
  shopState.type = "all";
  shopState.sale = false;
  shopState.search = "";
  shopState.sort = "default";

  const searchInput = document.getElementById("shop-search");
  const sortSelect = document.getElementById("shop-sort");
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "default";
  renderShop();
}

/* ---------------------------------------------------------------------
   5. Events
   ------------------------------------------------------------------ */
function initShopControls() {
  const searchInput = document.getElementById("shop-search");
  const sortSelect = document.getElementById("shop-sort");
  const grid = document.getElementById("product-grid");

  // Show the starting values in the controls
  if (searchInput) searchInput.value = shopState.search;
  if (sortSelect) sortSelect.value = shopState.sort;

  // Search while typing (debounce = wait 250 ms after the last key)
  if (searchInput) {
    searchInput.addEventListener("input", debounce(function () {
      shopState.search = searchInput.value.trim();
      renderShop();
    }, 250));
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      shopState.sort = sortSelect.value;
      renderShop();
    });
  }

  // Filter chips: one listener per bar using event delegation
  ["filter-category", "filter-type"].forEach(function (barId) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    bar.addEventListener("click", function (event) {
      const chip = event.target.closest(".filter-chip");
      if (!chip) return;

      const filter = chip.dataset.filter;
      if (filter === "sale") {
        shopState.sale = !shopState.sale;
      } else {
        shopState[filter] = chip.dataset.value;
      }
      renderShop();
    });
  });

  // "Clear Filters" button inside the empty-state message
  if (grid) {
    grid.addEventListener("click", function (event) {
      if (event.target.closest("[data-clear-filters]")) clearFilters();
    });
  }
}

/* ---------------------------------------------------------------------
   6. Start
   ------------------------------------------------------------------ */
onReady(function () {
  readStateFromUrl();
  initShopControls();
  renderFilterChips();

  const grid = document.getElementById("product-grid");

  if (prefersReducedMotion()) {
    renderShop();
    return;
  }

  // Short skeleton loading effect on first load only
  showSkeletons(grid, 8);
  renderResultsCount(getFilteredProducts().length);
  setTimeout(renderShop, 450);
});