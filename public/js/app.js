/* ─────────────────────────────────────────────────────────────
   THE ROSELINE EFFECT — FRONTIER CONTROLLER (DYNAMIC VER.)
───────────────────────────────────────────────────────────── */

// Default Products Mapping (seeded if not present in localStorage)
const DEFAULT_PRODUCTS = {
  1: {
    id: 1,
    name: 'Sérum Capilar',
    price: 1000,
    subtitle: 'Fortalece • Estimula • Protege',
    img: 'images/serum_capilar.png',
    desc: 'Elixir de restauración profunda y nutrición folicular. Sella la cutícula al instante para un acabado con brillo de espejo, estimulando el crecimiento y protegiendo contra el daño térmico.',
    badge: 'Best Seller'
  },
  2: {
    id: 2,
    name: 'Perfume Capilar',
    price: 1200,
    subtitle: 'Fragancia Sublime • Brillo Ligero',
    img: 'images/perfume_capilar.png',
    desc: 'Bruma aromática de alta costura diseñada para envolver el cabello en notas olfativas exquisitas de larga duración. Suaviza la fibra capilar, elimina olores ambientales y aporta un destello sutil y ligero.',
    badge: ''
  },
  3: {
    id: 3,
    name: 'Elixir de Feromonas',
    price: 1500,
    subtitle: 'Magnetismo • Confianza • Atracción',
    img: 'images/elixir_feromonas.png',
    desc: 'Concentrado magnético formulado para elevar la presencia y el atractivo natural. Trabaja mediante la estimulación química sensorial, proyectando una estela de seguridad y elegancia memorable.',
    badge: 'Exclusivo'
  }
};

// Global Store State
let products = {};
let cart = [];

// Security Sanitization Helper
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initProducts();
  initSpotlight();
  initScrollEffects();
  initMobileMenu();
  loadCart();
  initCheckout();
});

/* ─────────────────────────────────────────────────────────────
   0. CINEMATIC BRAND INTRO TIMER
───────────────────────────────────────────────────────────── */
function initIntro() {
  const intro = document.getElementById('brand-intro');
  if (!intro) return;

  // Let the logo draw and reveal, then trigger overlay fadeout
  setTimeout(() => {
    intro.classList.add('fade-out');
    
    // Completely remove element from flow once transition finishes
    setTimeout(() => {
      intro.remove();
    }, 800);
  }, 2500);
}

/* ─────────────────────────────────────────────────────────────
   1. PRODUCTS SEEDING & DYNAMIC RENDERING
───────────────────────────────────────────────────────────── */
function initProducts() {
  const localProducts = localStorage.getItem('roseline_products');
  if (!localProducts) {
    products = { ...DEFAULT_PRODUCTS };
    localStorage.setItem('roseline_products', JSON.stringify(products));
  } else {
    try {
      products = JSON.parse(localProducts);
    } catch (e) {
      products = { ...DEFAULT_PRODUCTS };
    }
  }
  renderCatalog();
}

function renderCatalog() {
  const container = document.getElementById('catalog-container');
  if (!container) return;

  let html = '';
  Object.values(products).forEach(prod => {
    if (prod.hidden) return; // Allow hiding products from admin panel

    const badgeHtml = prod.badge ? `<div class="product-badge">${escapeHTML(prod.badge)}</div>` : '';
    
    html += `
      <article class="product-card reveal" data-product-id="${prod.id}">
        <div class="product-image-container">
          <img src="${escapeHTML(prod.img) || 'images/placeholder.png'}" alt="${escapeHTML(prod.name)}" class="product-image" loading="lazy">
          ${badgeHtml}
        </div>
        <div class="product-info">
          <h3 class="product-title">${escapeHTML(prod.name)}</h3>
          <span class="product-subtitle">${escapeHTML(prod.subtitle)}</span>
          <p class="product-desc">${escapeHTML(prod.desc)}</p>
          <div class="product-meta">
            <span class="product-price">RD$ ${Number(prod.price).toLocaleString()}</span>
            <button class="btn btn-add-cart" onclick="addToCart(${prod.id})">Agregar</button>
          </div>
        </div>
      </article>
    `;
  });

  container.innerHTML = html;
  
  // Re-hook Intersection Observer for dynamically created items
  initScrollRevealElements();
}

/* ─────────────────────────────────────────────────────────────
   2. RADIAL MOUSE SPOTLIGHT
───────────────────────────────────────────────────────────── */
function initSpotlight() {
  const spotlight = document.getElementById('spotlight');
  if (!spotlight) return;

  document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    
    document.documentElement.style.setProperty('--mouse-x', `${x}px`);
    document.documentElement.style.setProperty('--mouse-y', `${y}px`);
  });
}

/* ─────────────────────────────────────────────────────────────
   3. SCROLL EFFECTS & REVEAL TRIGGERS
───────────────────────────────────────────────────────────── */
let scrollObserver;
function initScrollEffects() {
  const nav = document.getElementById('nav');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  initScrollRevealElements();
}

function initScrollRevealElements() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  };

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => scrollObserver.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   4. MOBILE NAVIGATION DRAWER
───────────────────────────────────────────────────────────── */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-nav-menu');
  const links = document.querySelectorAll('.mobile-link');

  if (!toggleBtn || !menu) return;

  const toggle = () => {
    menu.classList.toggle('open');
    toggleBtn.classList.toggle('active');
    
    const spans = toggleBtn.querySelectorAll('span');
    if (menu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  };

  toggleBtn.addEventListener('click', toggle);
  links.forEach(link => link.addEventListener('click', () => {
    if (menu.classList.contains('open')) toggle();
  }));
}

/* ─────────────────────────────────────────────────────────────
   5. E-COMMERCE CART ENGINE
───────────────────────────────────────────────────────────── */
function loadCart() {
  const savedCart = localStorage.getItem('roseline_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('roseline_cart', JSON.stringify(cart));
  updateCartUI();
}

window.addToCart = function(productId) {
  const prod = products[productId];
  if (!prod) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: productId,
      qty: 1
    });
  }
  
  saveCart();
  
  const cartDrawer = document.getElementById('cart-drawer');
  if (cartDrawer && typeof cartDrawer.showPopover === 'function') {
    cartDrawer.showPopover();
  }
};

window.updateQty = function(productId, delta) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(item => item.id !== productId);
  }
  saveCart();
};

window.removeItem = function(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
};

function updateCartUI() {
  const countLabel = document.getElementById('cart-count');
  const itemsContainer = document.getElementById('cart-items-container');
  const summarySection = document.getElementById('cart-summary-section');
  const totalLabel = document.getElementById('cart-total-price-label');

  if (!countLabel || !itemsContainer || !summarySection || !totalLabel) return;

  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  countLabel.textContent = totalCount;
  
  countLabel.style.transform = 'scale(1.2)';
  setTimeout(() => countLabel.style.transform = 'none', 200);

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <p>Tu bolsa de compras está vacía.</p>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('cart-drawer').hidePopover()">Ver Colección</button>
      </div>
    `;
    summarySection.style.display = 'none';
    return;
  }

  summarySection.style.display = 'block';
  let totalPrice = 0;
  let html = '';

  cart.forEach(item => {
    const details = products[item.id];
    if (!details) return;

    const subtotal = details.price * item.qty;
    totalPrice += subtotal;

    html += `
      <div class="cart-item">
        <img class="cart-item-img" src="${escapeHTML(details.img) || 'images/placeholder.png'}" alt="${escapeHTML(details.name)}">
        <div class="cart-item-info">
          <h4>${escapeHTML(details.name)}</h4>
          <span class="cart-item-price">RD$ ${Number(details.price).toLocaleString()}</span>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeItem(${item.id})" aria-label="Eliminar item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;
  });

  itemsContainer.innerHTML = html;
  totalLabel.textContent = `RD$ ${totalPrice.toLocaleString()}`;
}

/* ─────────────────────────────────────────────────────────────
   6. CHECKOUT WHATSAPP REDIRECT + ORDER CAPTURING
───────────────────────────────────────────────────────────── */
function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // Read vendor phone number from settings in localStorage, or fallback
  const getWhatsAppNumber = () => {
    const settings = localStorage.getItem('roseline_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        return parsed.whatsapp || VENDOR_WHATSAPP;
      } catch(e) {}
    }
    return VENDOR_WHATSAPP;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = escapeHTML(document.getElementById('checkout-name').value.trim());
    const address = escapeHTML(document.getElementById('checkout-address').value.trim());
    const deliverySelect = document.getElementById('checkout-delivery');
    const deliveryText = deliverySelect.options[deliverySelect.selectedIndex].text;
    const deliveryVal = deliverySelect.value;

    if (cart.length === 0) return;

    // Fetch order details
    const orderItems = [];
    let total = 0;
    
    let message = `*NUEVO PEDIDO - THE ROSELINE EFFECT*\n`;
    message += `==============================\n\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `📍 *Dirección/Sector:* ${address}\n`;
    message += `🚚 *Método de Envío:* ${deliveryText}\n\n`;
    message += `🛒 *Detalle del Pedido:*\n`;

    cart.forEach(item => {
      const details = products[item.id];
      if (!details) return;
      
      const subtotal = details.price * item.qty;
      total += subtotal;
      
      orderItems.push({
        id: item.id,
        name: details.name,
        price: details.price,
        qty: item.qty,
        subtotal: subtotal
      });

      message += `- ${item.qty}x ${details.name} (RD$ ${Number(details.price).toLocaleString()} c/u) -> *RD$ ${subtotal.toLocaleString()}*\n`;
    });

    message += `\n==============================\n`;
    message += `💰 *TOTAL A PAGAR: RD$ ${total.toLocaleString()}*\n\n`;
    message += `⚡ _"no solo es un cambio, es el efecto de roseline"_`;

    // Save order details to localStorage for admin.html history
    const savedOrders = localStorage.getItem('roseline_orders');
    let ordersList = [];
    if (savedOrders) {
      try { ordersList = JSON.parse(savedOrders); } catch(e) {}
    }
    
    const newOrder = {
      id: 'RSL-' + Date.now().toString().slice(-6),
      clientName: name,
      address: address,
      deliveryType: deliveryVal,
      items: orderItems,
      total: total,
      status: 'Pendiente',
      timestamp: new Date().toISOString()
    };
    
    ordersList.unshift(newOrder); // Add to the top of recent orders list
    localStorage.setItem('roseline_orders', JSON.stringify(ordersList));

    // Get current configured number and encode WhatsApp url
    const targetPhone = getWhatsAppNumber();
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;

    // Reset checkout cart
    cart = [];
    saveCart();
    
    // Close Drawer
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer && typeof cartDrawer.hidePopover === 'function') {
      cartDrawer.hidePopover();
    }

    form.reset();

    // Direct WhatsApp redirect open
    window.open(whatsappUrl, '_blank');
  });
}
