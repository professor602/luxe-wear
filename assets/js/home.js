/* =====================================================================
   LuxeWear – home.js
   Fills the product grids on index.html:
   Featured, New Arrivals and Best Sellers.
   Uses PRODUCTS (products.js) and renderProductGrid / showSkeletons (common.js).
   ===================================================================== */

// Pick the products for each home page section.
function getHomeSections() {
  return [
    {
      containerId: "featured-grid",
      products: PRODUCTS.filter(function (p) { return p.featured; }).slice(0, 8)
    },
    {
      containerId: "new-grid",
      products: PRODUCTS.filter(function (p) { return p.newArrival; }).slice(0, 4)
    },
    {
      containerId: "best-grid",
      products: PRODUCTS
        .filter(function (p) { return p.bestSeller; })
        .sort(function (a, b) { return b.popularity - a.popularity; })
        .slice(0, 4)
    }
  ];
}

onReady(function () {
  const skipDelay = prefersReducedMotion();

  getHomeSections().forEach(function (section) {
    const container = document.getElementById(section.containerId);
    if (!container) return;

    if (skipDelay) {
      renderProductGrid(container, section.products);
      return;
    }

    // Show skeleton cards briefly, then the real products (a polished loading effect)
    showSkeletons(container, section.products.length);
    setTimeout(function () {
      renderProductGrid(container, section.products);
    }, 600);
  });
});