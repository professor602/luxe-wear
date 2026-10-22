/* =====================================================================
   LuxeWear – products.js
   Single source of truth for all product data.
   Every page reads products from here (shop, cart, wishlist, checkout).
   Cart and wishlist store only product IDs, never copies of this data.
   ===================================================================== */

/* ---------- Helper: builds an Unsplash image URL ---------- */
function photo(id, options = {}) {
  const { w = 800, h = 1000, crop = "entropy" } = options;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=${crop}&w=${w}&h=${h}&q=80`;
}

/* ---------- Reusable colors and sizes ---------- */
const COLORS = {
  black:  { name: "Black",  hex: "#111111" },
  white:  { name: "White",  hex: "#f8f8f8" },
  beige:  { name: "Beige",  hex: "#d9c3a5" },
  cream:  { name: "Cream",  hex: "#f3ead8" },
  navy:   { name: "Navy",   hex: "#1f2a44" },
  grey:   { name: "Grey",   hex: "#8a8a8a" },
  brown:  { name: "Brown",  hex: "#6b4a32" },
  olive:  { name: "Olive",  hex: "#6b6f45" },
  red:    { name: "Red",    hex: "#a3262a" },
  blush:  { name: "Blush",  hex: "#e8c4c4" },
  gold:   { name: "Gold",   hex: "#c9a24d" },
  blue:   { name: "Blue",   hex: "#3f6fa8" },
  yellow: { name: "Yellow", hex: "#e3b93c" }
};

const SIZES = {
  clothing:   ["S", "M", "L", "XL"],
  menShoes:   ["40", "41", "42", "43", "44"],
  womenShoes: ["36", "37", "38", "39", "40"],
  kidsShoes:  ["28", "29", "30", "31", "32"],
  kidsClothing: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
  oneSize:    ["One Size"]
};

/* ---------- Product list ----------
   category: "men" | "women" | "kids"
   type:     "clothing" | "shoes" | "accessories"
   popularity: higher = more popular (used for sorting)
   Flags: featured, bestSeller, newArrival (used on the home page)
   -------------------------------------------------------------------- */
const PRODUCTS = [
  /* ============================ MEN ============================ */
  {
    id: 1, name: "Essential Cotton Tee", category: "men", type: "clothing",
    price: 29, oldPrice: null,
    description: "A heavyweight organic cotton tee with a relaxed fit and a soft, structured feel. The everyday layer you will reach for first.",
    imageId: "1521572163474-6864f9cf17ab",
    sizes: SIZES.clothing, colors: [COLORS.white, COLORS.black, COLORS.grey],
    rating: 4.6, popularity: 95, featured: false, bestSeller: true, newArrival: false
  },
  {
    id: 2, name: "Leather Biker Jacket", category: "men", type: "clothing",
    price: 189, oldPrice: 229,
    description: "Genuine-look leather jacket with an asymmetrical zip, quilted shoulders and a satin lining. Timeless, sharp and built to last.",
    imageId: "1551028719-00167b16eac5",
    sizes: SIZES.clothing, colors: [COLORS.black, COLORS.brown],
    rating: 4.8, popularity: 88, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 3, name: "Tailored Wool Blazer", category: "men", type: "clothing",
    price: 159, oldPrice: null,
    description: "A sharply cut single-breasted blazer in a wool blend. Half-lined for comfort, perfect for the office or evening events.",
    imageId: "1594938298603-c8148c4dae35",
    sizes: SIZES.clothing, colors: [COLORS.navy, COLORS.grey, COLORS.black],
    rating: 4.7, popularity: 80, featured: true, bestSeller: false, newArrival: true
  },
  {
    id: 4, name: "Oxford Button Shirt", category: "men", type: "clothing",
    price: 59, oldPrice: 75,
    description: "Classic oxford weave shirt with a button-down collar. Crisp, breathable and easy to dress up or down.",
    imageId: "1596755094514-f87e34085b2c",
    sizes: SIZES.clothing, colors: [COLORS.white, COLORS.blue, COLORS.cream],
    rating: 4.4, popularity: 70, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 5, name: "Court Leather Sneakers", category: "men", type: "shoes",
    price: 99, oldPrice: null,
    description: "Minimal low-top sneakers in smooth leather with a cushioned insole and a durable rubber cupsole.",
    imageId: "1549298916-b41d501d3772",
    sizes: SIZES.menShoes, colors: [COLORS.white, COLORS.black],
    rating: 4.5, popularity: 92, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 6, name: "Velocity Runner Sneakers", category: "men", type: "shoes",
    price: 119, oldPrice: 140,
    description: "Lightweight performance runners with a breathable knit upper and responsive foam sole for all-day comfort.",
    imageId: "1542291026-7eec264c27ff",
    sizes: SIZES.menShoes, colors: [COLORS.red, COLORS.black, COLORS.grey],
    rating: 4.3, popularity: 75, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 7, name: "Chronograph Steel Watch", category: "men", type: "accessories",
    price: 249, oldPrice: null,
    description: "Stainless steel chronograph with a sapphire-style crystal, date window and a refined leather strap.",
    imageId: "1524592094714-0f0654e20314",
    sizes: SIZES.oneSize, colors: [COLORS.gold, COLORS.black],
    rating: 4.9, popularity: 85, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 8, name: "Aviator Sunglasses", category: "men", type: "accessories",
    price: 69, oldPrice: null,
    description: "Lightweight metal-frame aviators with UV400 polarized lenses. A classic silhouette that suits every face.",
    imageId: "1572635196237-14b3f281503f",
    sizes: SIZES.oneSize, colors: [COLORS.gold, COLORS.black],
    rating: 4.2, popularity: 60, featured: false, bestSeller: false, newArrival: false
  },

  /* ============================ WOMEN ============================ */
  {
    id: 9, name: "Satin Slip Dress", category: "women", type: "clothing",
    price: 89, oldPrice: 110,
    description: "A fluid satin midi dress with adjustable straps and a bias cut that drapes beautifully. Effortless evening elegance.",
    imageId: "1566174053879-31528523f8ae",
    sizes: SIZES.clothing, colors: [COLORS.red, COLORS.black, COLORS.cream],
    rating: 4.8, popularity: 98, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 10, name: "Floral Wrap Dress", category: "women", type: "clothing",
    price: 79, oldPrice: null,
    description: "A breezy wrap dress with a delicate floral print, flutter sleeves and a flattering tie waist.",
    imageId: "1572804013309-59a88b7e92f1",
    sizes: SIZES.clothing, colors: [COLORS.blush, COLORS.cream],
    rating: 4.5, popularity: 82, featured: true, bestSeller: false, newArrival: true
  },
  {
    id: 11, name: "Cashmere Blend Sweater", category: "women", type: "clothing",
    price: 119, oldPrice: 149,
    description: "A cozy crew-neck sweater in a soft cashmere blend. Light enough for layering, warm enough for winter.",
    imageId: "1434389677669-e08b4cac3105",
    sizes: SIZES.clothing, colors: [COLORS.beige, COLORS.cream, COLORS.grey],
    rating: 4.7, popularity: 90, featured: false, bestSeller: true, newArrival: false
  },
  {
    id: 12, name: "High-Waist Tailored Trousers", category: "women", type: "clothing",
    price: 85, oldPrice: null,
    description: "Wide-leg trousers with a high waist, pressed front crease and a fluid drape. Polished from desk to dinner.",
    imageId: "1594633312681-425c7b97ccd1",
    sizes: SIZES.clothing, colors: [COLORS.black, COLORS.beige, COLORS.navy],
    rating: 4.4, popularity: 68, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 13, name: "Classic Stiletto Heels", category: "women", type: "shoes",
    price: 109, oldPrice: null,
    description: "Pointed-toe stilettos in smooth finish with a cushioned footbed and a stable 8 cm heel.",
    imageId: "1543163521-1bf539c55dd2",
    sizes: SIZES.womenShoes, colors: [COLORS.black, COLORS.red, COLORS.beige],
    rating: 4.3, popularity: 72, featured: false, bestSeller: false, newArrival: false
  },
  {
    id: 14, name: "Leather Ankle Boots", category: "women", type: "shoes",
    price: 139, oldPrice: 165,
    description: "Sleek ankle boots with a block heel and inner zip. Soft leather-look upper that goes with everything.",
    imageId: "1491553895911-0055eca6402d",
    sizes: SIZES.womenShoes, colors: [COLORS.black, COLORS.brown],
    rating: 4.6, popularity: 78, featured: true, bestSeller: false, newArrival: true
  },
  {
    id: 15, name: "Structured Leather Tote", category: "women", type: "accessories",
    price: 169, oldPrice: null,
    description: "Spacious structured tote with gold-tone hardware, an interior zip pocket and room for a 13-inch laptop.",
    imageId: "1548036328-c9fa89d128fa",
    sizes: SIZES.oneSize, colors: [COLORS.beige, COLORS.black, COLORS.brown],
    rating: 4.9, popularity: 96, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 16, name: "Mini Crossbody Bag", category: "women", type: "accessories",
    price: 74, oldPrice: 95,
    description: "A compact crossbody with an adjustable chain strap and magnetic closure. Small in size, big on style.",
    imageId: "1584917865442-de89df76afd3",
    sizes: SIZES.oneSize, colors: [COLORS.cream, COLORS.black, COLORS.blush],
    rating: 4.5, popularity: 74, featured: false, bestSeller: false, newArrival: true
  },

  /* ============================ KIDS ============================ */
  {
    id: 17, name: "Striped Cotton Tee", category: "kids", type: "clothing",
    price: 19, oldPrice: null,
    description: "A soft, breathable striped tee made from gentle cotton. Easy to wash and comfortable for play.",
    imageId: "1503944583220-79d8926ad5e2",
    sizes: SIZES.kidsClothing, colors: [COLORS.navy, COLORS.white, COLORS.yellow],
    rating: 4.4, popularity: 66, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 18, name: "Denim Dungarees", category: "kids", type: "clothing",
    price: 39, oldPrice: 49,
    description: "Hard-wearing denim dungarees with adjustable straps and roomy pockets, made for adventures.",
    imageId: "1519238263530-99bdd11df2ea",
    sizes: SIZES.kidsClothing, colors: [COLORS.blue, COLORS.navy],
    rating: 4.6, popularity: 79, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 19, name: "Quilted Puffer Jacket", category: "kids", type: "clothing",
    price: 54, oldPrice: null,
    description: "A warm, lightweight puffer with a water-resistant shell, fleece-lined pockets and a snug hood.",
    imageId: "1471286174890-9c112ffca5b4",
    sizes: SIZES.kidsClothing, colors: [COLORS.red, COLORS.navy, COLORS.olive],
    rating: 4.5, popularity: 71, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 20, name: "Cozy Cotton Hoodie", category: "kids", type: "clothing",
    price: 34, oldPrice: null,
    description: "A brushed-fleece pullover hoodie with a kangaroo pocket. Soft on the skin and perfect for cooler days.",
    imageId: "1622290291468-a28f7a7dc6a8",
    sizes: SIZES.kidsClothing, colors: [COLORS.grey, COLORS.blush, COLORS.navy],
    rating: 4.7, popularity: 84, featured: true, bestSeller: true, newArrival: false
  },
  {
    id: 21, name: "Lightweight Kids Sneakers", category: "kids", type: "shoes",
    price: 44, oldPrice: 55,
    description: "Flexible, easy-on sneakers with hook-and-loop straps and a cushioned sole built for running and jumping.",
    imageId: "1514989940723-e8e51635b782",
    sizes: SIZES.kidsShoes, colors: [COLORS.white, COLORS.blue, COLORS.red],
    rating: 4.3, popularity: 63, featured: false, bestSeller: false, newArrival: false
  },
  {
    id: 22, name: "Twirl Summer Dress", category: "kids", type: "clothing",
    price: 36, oldPrice: null,
    description: "A light cotton dress with a full skirt made for twirling. Breathable and cheerful for sunny days.",
    imageId: "1518831959646-742c3a14ebf7",
    sizes: SIZES.kidsClothing, colors: [COLORS.yellow, COLORS.blush],
    rating: 4.6, popularity: 69, featured: false, bestSeller: false, newArrival: true
  },
  {
    id: 23, name: "Adventure Mini Backpack", category: "kids", type: "accessories",
    price: 29, oldPrice: null,
    description: "A durable mini backpack with padded straps, a front pocket and a name-label window. Great for school and trips.",
    imageId: "1553062407-98eeb64c6a62",
    sizes: SIZES.oneSize, colors: [COLORS.olive, COLORS.navy, COLORS.red],
    rating: 4.5, popularity: 65, featured: false, bestSeller: false, newArrival: false
  },
  {
    id: 24, name: "Chunky Knit Beanie", category: "kids", type: "accessories",
    price: 15, oldPrice: 19,
    description: "A stretchy chunky-knit beanie with a soft lining. Keeps little ears warm without the itch.",
    imageId: "1576871337632-b9aef4c17ab9",
    sizes: SIZES.oneSize, colors: [COLORS.grey, COLORS.cream, COLORS.red],
    rating: 4.2, popularity: 55, featured: false, bestSeller: false, newArrival: false
  }
];

/* ---------- Build image URLs for every product ----------
   image      -> main image used on cards
   hoverImage -> alternate crop shown when hovering a card
   gallery    -> three images shown on the product details page
   -------------------------------------------------------------------- */
PRODUCTS.forEach(function (product) {
  product.image = photo(product.imageId);
  product.hoverImage = photo(product.imageId, { crop: "top" });
  product.gallery = [
    product.image,
    product.hoverImage,
    photo(product.imageId, { crop: "bottom" })
  ];
});

/* ---------- Product helper functions ---------- */

// Find one product by its ID (accepts number or string). Returns undefined if not found.
function getProductById(id) {
  return PRODUCTS.find(function (p) { return p.id === Number(id); });
}

// Get all products in a category: "men", "women" or "kids".
function getProductsByCategory(category) {
  return PRODUCTS.filter(function (p) { return p.category === category; });
}

// Get related products: same category, excluding the current product.
function getRelatedProducts(productId, limit = 4) {
  const current = getProductById(productId);
  if (!current) return [];
  return PRODUCTS
    .filter(function (p) { return p.category === current.category && p.id !== current.id; })
    .slice(0, limit);
}

// Format a number as a price string, e.g. 29 -> "$29.00".
function formatPrice(amount) {
  return "$" + Number(amount || 0).toFixed(2);
}