/* ─────────────────────────────────────────────────────────────
   THE ROSELINE EFFECT — ADMIN CONTROLLER (SHOPIFY ENGINE)
───────────────────────────────────────────────────────────── */

// Data stores
let products = {};
let orders = [];
let settings = { whatsapp: '18499187479', shopName: 'The Roseline Effect' };

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

// Auth PIN logic
const CORRECT_PIN = '7479'; // Last 4 digits of 849-918-7479

function initAuth() {
  const overlay = document.getElementById('admin-auth-overlay');
  const errorMsg = document.getElementById('auth-error');
  const digits = document.querySelectorAll('.pin-digit');

  if (!overlay) return;

  if (sessionStorage.getItem('roseline_admin_auth') !== 'true') {
    window.location.replace('index.html');
    return;
  } else {
    overlay.style.display = 'none';
    return;
  }

  // Handle focus behavior on digits typing
  digits.forEach((input, index) => {
    // Focus first input automatically
    if (index === 0) input.focus();

    input.addEventListener('input', (e) => {
      const val = e.target.value;
      
      // Keep only last character typed
      if (val.length > 1) {
        e.target.value = val.slice(-1);
      }

      if (e.target.value && index < digits.length - 1) {
        digits[index + 1].removeAttribute('disabled');
        digits[index + 1].focus();
      }

      // Check if PIN is fully entered
      const pin = Array.from(digits).map(i => i.value).join('');
      if (pin.length === digits.length) {
        if (pin === CORRECT_PIN) {
          sessionStorage.setItem('roseline_admin_auth', 'true');
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.style.display = 'none';
          }, 300);
        } else {
          // Failure
          errorMsg.style.display = 'block';
          digits.forEach((i, idx) => {
            i.value = '';
            if (idx > 0) i.setAttribute('disabled', 'true');
          });
          digits[0].focus();
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        digits[index - 1].focus();
        digits[index].setAttribute('disabled', 'true');
      }
    });
  });
}

// Image compression helper (max width/height 400px, jpeg format, 0.7 quality)
function initImageUploader() {
  const imgFileInput = document.getElementById('prod-img-file');
  if (!imgFileInput) return;

  imgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const max_size = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        document.getElementById('prod-img').value = dataUrl;
        document.getElementById('prod-img-preview').src = dataUrl;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  loadData();
  initSpotlight();
  initSettingsForm();
  initImageUploader();
  renderDashboard();
});

/* ─────────────────────────────────────────────────────────────
   1. DATABASE SYNCHRONIZERS (LOAD & SAVE)
───────────────────────────────────────────────────────────── */
function loadData() {
  // Load products (seed defaults if empty)
  const localProducts = localStorage.getItem('roseline_products');
  if (localProducts) {
    try {
      products = JSON.parse(localProducts);
      // Migrate product 1 if it has the old description
      if (products[1] && (products[1].desc.includes('Elixir de restauración profunda') || !products[1].desc.includes('Nuestro sérum capilar está diseñado'))) {
        products[1].name = 'Sérum Capilar (Hair Serum)';
        products[1].desc = 'Nuestro sérum capilar está diseñado para nutrir, fortalecer e hidratar tu cabello desde la raíz hasta las puntas. Ayuda a reducir el quiebre, aporta brillo, suavidad y controla el frizz, favoreciendo un crecimiento más saludable. Además, protege tu cabello de los daños causados por el calor y factores externos.';
        localStorage.setItem('roseline_products', JSON.stringify(products));
      }
    } catch(e) {}
  } else {
    // Seeding products automatically if admin opens first
    products = {
      1: { id: 1, name: 'Sérum Capilar (Hair Serum)', price: 1000, subtitle: 'Fortalece • Estimula • Protege', img: 'images/serum_capilar.png', desc: 'Nuestro sérum capilar está diseñado para nutrir, fortalecer e hidratar tu cabello desde la raíz hasta las puntas. Ayuda a reducir el quiebre, aporta brillo, suavidad y controla el frizz, favoreciendo un crecimiento más saludable. Además, protege tu cabello de los daños causados por el calor y factores externos.', badge: 'Best Seller' },
      2: { id: 2, name: 'Perfume Capilar', price: 1200, subtitle: 'Fragancia Sublime • Brillo Ligero', img: 'images/perfume_capilar.png', desc: 'Bruma aromática de alta costura diseñada para envolver el cabello en notas olfativas exquisitas de larga duración. Suaviza la fibra capilar, elimina olores ambientales y aporta un destello sutil y ligero.', badge: '' },
      3: { id: 3, name: 'Elixir de Feromonas', price: 1500, subtitle: 'Magnetismo • Confianza • Atracción', img: 'images/elixir_feromonas.png', desc: 'Concentrado magnético formulado para elevar la presencia y el atractivo natural. Trabaja mediante la estimulación química sensorial, proyectando una estela de seguridad y elegancia memorable.', badge: 'Exclusivo' }
    };
    localStorage.setItem('roseline_products', JSON.stringify(products));
  }

  // Load orders (simulating sample orders if empty to make it look active at first look!)
  const localOrders = localStorage.getItem('roseline_orders');
  if (localOrders) {
    try { orders = JSON.parse(localOrders); } catch(e) {}
  } else {
    // Seeding mock orders for illustration
    orders = [
      { id: 'RSL-39281', clientName: 'Maria Rodriguez', address: 'Piantini, Santo Domingo', deliveryType: 'delivery_sd', items: [{ id: 1, name: 'Sérum Capilar (Hair Serum)', price: 1000, qty: 2, subtotal: 2000 }], total: 2000, status: 'Completado', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'RSL-19284', clientName: 'Laura Sanchez', address: 'Bella Vista, Santo Domingo', deliveryType: 'delivery_sd', items: [{ id: 3, name: 'Elixir de Feromonas', price: 1500, qty: 1, subtotal: 1500 }], total: 1500, status: 'Pendiente', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: 'RSL-83921', clientName: 'Ana Perez', address: 'Santiago de los Caballeros', deliveryType: 'delivery_country', items: [{ id: 2, name: 'Perfume Capilar', price: 1200, qty: 1, subtotal: 1200 }, { id: 1, name: 'Sérum Capilar (Hair Serum)', price: 1000, qty: 1, subtotal: 1000 }], total: 2200, status: 'Completado', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() }
    ];
    localStorage.setItem('roseline_orders', JSON.stringify(orders));
  }

  // Load settings
  const localSettings = localStorage.getItem('roseline_settings');
  if (localSettings) {
    try { settings = JSON.parse(localSettings); } catch(e) {}
  } else {
    localStorage.setItem('roseline_settings', JSON.stringify(settings));
  }
}

function saveProducts() {
  localStorage.setItem('roseline_products', JSON.stringify(products));
}

function saveOrders() {
  localStorage.setItem('roseline_orders', JSON.stringify(orders));
}

/* ─────────────────────────────────────────────────────────────
   2. TAB SWITCHER
───────────────────────────────────────────────────────────── */
function initTabs() {
  const menuButtons = document.querySelectorAll('.menu-btn');
  const sections = document.querySelectorAll('.admin-section');
  const title = document.getElementById('page-title');

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active classes
      menuButtons.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active to current
      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      document.getElementById(target).classList.add('active');

      // Update Header Title
      const sectionName = btn.textContent.trim().replace(/[^\w\sñáéíóú]/gi, '').trim();
      title.textContent = sectionName === 'Resumen' ? 'Resumen de Tienda' : sectionName;

      // Re-trigger visual tasks
      if (target === 'sec-dashboard') {
        renderDashboard();
      } else if (target === 'sec-orders') {
        renderOrders();
      } else if (target === 'sec-products') {
        renderProducts();
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   3. RENDERING DASHBOARD METRICS & PURE CANVAS CHART
───────────────────────────────────────────────────────────── */
function renderDashboard() {
  const statSales = document.getElementById('stat-sales');
  const statOrders = document.getElementById('stat-orders');
  const statAov = document.getElementById('stat-aov');
  const badgeCount = document.getElementById('orders-badge-count');

  // Filter non-cancelled orders for statistics
  const activeOrders = orders.filter(o => o.status !== 'Cancelado');
  const totalSalesVal = activeOrders.reduce((acc, o) => acc + o.total, 0);
  const aovVal = activeOrders.length > 0 ? Math.round(totalSalesVal / activeOrders.length) : 0;

  statSales.textContent = `RD$ ${totalSalesVal.toLocaleString()}`;
  statOrders.textContent = orders.length;
  statAov.textContent = `RD$ ${aovVal.toLocaleString()}`;

  // Badge sidebar notification count (Pending orders only)
  const pendingCount = orders.filter(o => o.status === 'Pendiente').length;
  badgeCount.textContent = pendingCount;
  badgeCount.style.display = pendingCount > 0 ? 'inline-block' : 'none';

  // Render performance sales graph on Canvas
  drawChart(activeOrders);
}

function drawChart(activeOrders) {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Set dimensions correctly matching parent width
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Parse last 7 orders or fake data points to draw a beautiful line
  let chartData = [];
  if (activeOrders.length === 0) {
    chartData = [0, 0, 0, 0, 0, 0, 0];
  } else {
    // Aggregate daily or recent order amounts chronologically
    const reversed = [...activeOrders].reverse();
    chartData = reversed.slice(-7).map(o => o.total);
    // Pad array with zeroes if less than 5 points
    while (chartData.length < 5) {
      chartData.unshift(0);
    }
  }

  const maxVal = Math.max(...chartData, 3000) * 1.15;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Draw axes grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const y = padding.top + (graphHeight / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Draw values
    const gridVal = Math.round(maxVal - (maxVal / gridSteps) * i);
    ctx.fillStyle = '#8E8D94';
    ctx.font = '10px Inter';
    ctx.fillText(`RD$ ${gridVal.toLocaleString()}`, padding.left - 55, y + 4);
  }

  // Draw points and connections
  const points = chartData.map((val, idx) => {
    const x = padding.left + (graphWidth / (chartData.length - 1)) * idx;
    const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
    return { x, y, val };
  });

  // 1. Draw connection line with luxury gold gradient
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2;
    const yc = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = '#C5A880';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 2. Draw gradient filling under line
  const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  fillGradient.addColorStop(0, 'rgba(197, 168, 128, 0.18)');
  fillGradient.addColorStop(1, 'rgba(197, 168, 128, 0.0)');
  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  ctx.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2;
    const yc = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // 3. Draw circular vertices/nodes
  points.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Draw label for the data point
    if (pt.val > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Inter';
      ctx.fillText(`RD$ ${pt.val.toLocaleString()}`, pt.x - 22, pt.y - 12);
    }
  });

  // Draw X axis label days representation
  ctx.fillStyle = '#8E8D94';
  ctx.font = '10px Inter';
  points.forEach((pt, idx) => {
    ctx.fillText(`P-${points.length - idx}`, pt.x - 10, height - padding.bottom + 20);
  });
}

/* ─────────────────────────────────────────────────────────────
   4. ORDERS MANAGEMENT (LIST & STATUS UPDATES)
───────────────────────────────────────────────────────────── */
function renderOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--grey); padding: 40px 0;">No hay pedidos registrados aún.</td>
      </tr>
    `;
    return;
  }

  let html = '';
  orders.forEach(ord => {
    const dateStr = new Date(ord.timestamp).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const itemsStr = ord.items.map(item => `${item.qty}x ${escapeHTML(item.name)}`).join('<br>');
    const statusClass = ord.status.toLowerCase();

    html += `
      <tr>
        <td><strong>#${escapeHTML(ord.id)}</strong></td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(ord.clientName)}</div>
          <div style="font-size: 11px; color: var(--grey);">${escapeHTML(ord.address)}</div>
        </td>
        <td style="color: var(--grey); font-size: 12px;">${dateStr}</td>
        <td style="font-size: 13px;">${itemsStr}</td>
        <td><strong>RD$ ${ord.total.toLocaleString()}</strong></td>
        <td>
          <span class="status-badge ${statusClass}">${escapeHTML(ord.status)}</span>
        </td>
        <td>
          <select class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 12px; background: var(--black-alt);" onchange="updateOrderStatus('${escapeHTML(ord.id)}', this.value)">
            <option value="Pendiente" ${ord.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Completado" ${ord.status === 'Completado' ? 'selected' : ''}>Completado</option>
            <option value="Cancelado" ${ord.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

window.updateOrderStatus = function(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = newStatus;
  saveOrders();
  renderOrders();
  renderDashboard();
};

window.clearOrders = function() {
  if (confirm('¿Estás seguro de que deseas vaciar el historial de pedidos?')) {
    orders = [];
    saveOrders();
    renderOrders();
    renderDashboard();
  }
};

/* ─────────────────────────────────────────────────────────────
   5. PRODUCTS INVENTORY MANAGEMENT (CRUD)
───────────────────────────────────────────────────────────── */
function renderProducts() {
  const container = document.getElementById('admin-products-container');
  if (!container) return;

  let html = '';
  Object.values(products).forEach(prod => {
    const visibilityText = prod.hidden ? 'Oculto' : 'Visible';
    const visibilityBtnText = prod.hidden ? 'Mostrar' : 'Ocultar';

    html += `
      <div class="admin-prod-card glass-container" id="admin-prod-${prod.id}">
        <div class="admin-prod-header">
          <img class="admin-prod-thumbnail" src="${escapeHTML(prod.img) || 'images/placeholder.png'}" alt="${escapeHTML(prod.name)}">
          <div class="admin-prod-title-meta">
            <h4>${escapeHTML(prod.name)}</h4>
            <span>RD$ ${Number(prod.price).toLocaleString()} • ${visibilityText}</span>
          </div>
        </div>
        <div class="admin-prod-body">
          <p>${escapeHTML(prod.desc)}</p>
        </div>
        <div class="admin-prod-actions">
          <button class="btn btn-secondary btn-sm" style="flex-grow: 1;" onclick="openEditProductModal(${prod.id})">Editar</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--grey);" onclick="toggleProductVisibility(${prod.id})">${visibilityBtnText}</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--error);" onclick="deleteProduct(${prod.id})">Borrar</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Modal open/close actions
window.openAddProductModal = function() {
  document.getElementById('modal-title').textContent = 'Añadir Producto';
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-img').value = '';
  document.getElementById('prod-img-preview').src = 'images/placeholder.png';
  document.getElementById('product-modal').style.display = 'flex';
};

window.openEditProductModal = function(productId) {
  const prod = products[productId];
  if (!prod) return;

  document.getElementById('modal-title').textContent = 'Editar Producto';
  document.getElementById('prod-id').value = prod.id;
  document.getElementById('prod-name').value = prod.name;
  document.getElementById('prod-price').value = prod.price;
  document.getElementById('prod-subtitle').value = prod.subtitle || '';
  document.getElementById('prod-desc').value = prod.desc;
  document.getElementById('prod-img').value = prod.img || '';
  document.getElementById('prod-img-preview').src = prod.img || 'images/placeholder.png';
  document.getElementById('prod-badge').value = prod.badge || '';

  document.getElementById('product-modal').style.display = 'flex';
};

window.closeProductModal = function() {
  document.getElementById('product-modal').style.display = 'none';
};

// Form submit: save changes
document.getElementById('product-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const idVal = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const price = Number(document.getElementById('prod-price').value);
  const subtitle = document.getElementById('prod-subtitle').value.trim();
  const desc = document.getElementById('prod-desc').value.trim();
  const img = document.getElementById('prod-img').value.trim();
  const badge = document.getElementById('prod-badge').value.trim();

  if (idVal) {
    // Edit existing product
    const prodId = Number(idVal);
    if (products[prodId]) {
      products[prodId].name = name;
      products[prodId].price = price;
      products[prodId].subtitle = subtitle;
      products[prodId].desc = desc;
      if (img) products[prodId].img = img;
      products[prodId].badge = badge;
    }
  } else {
    // Create new product
    const newId = Date.now();
    products[newId] = {
      id: newId,
      name: name,
      price: price,
      subtitle: subtitle,
      desc: desc,
      img: img || 'images/placeholder.png',
      badge: badge,
      hidden: false
    };
  }

  saveProducts();
  renderProducts();
  closeProductModal();
});

window.toggleProductVisibility = function(productId) {
  const prod = products[productId];
  if (!prod) return;

  prod.hidden = !prod.hidden;
  saveProducts();
  renderProducts();
};

window.deleteProduct = function(productId) {
  if (confirm('¿Estás seguro de que deseas borrar este producto del catálogo?')) {
    delete products[productId];
    saveProducts();
    renderProducts();
  }
};

/* ─────────────────────────────────────────────────────────────
   6. SETTINGS FORM ACTIONS
───────────────────────────────────────────────────────────── */
function initSettingsForm() {
  const setWhatsapp = document.getElementById('set-whatsapp');
  const setShopName = document.getElementById('set-shopname');
  const form = document.getElementById('settings-form');

  if (!setWhatsapp || !setShopName || !form) return;

  // Set initial inputs values from localStorage settings
  setWhatsapp.value = settings.whatsapp || '';
  setShopName.value = settings.shopName || '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    settings.whatsapp = setWhatsapp.value.trim();
    settings.shopName = setShopName.value.trim();

    localStorage.setItem('roseline_settings', JSON.stringify(settings));
    alert('Configuración guardada correctamente.');
  });
}

/* ─────────────────────────────────────────────────────────────
   7. RADIAL MOUSE SPOTLIGHT (ADMIN VERSION)
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
