/* ==========================================================
   DSCAT COFF · Configuración (edita aquí lo importante)
   ========================================================== */
const CONFIG = {
  whatsapp: '573000000000',          // Tu número con código de país, sin + ni espacios
  productName: 'Reserva Huila',
  prices: {                           // Precios en COP por presentación (gramos)
    '250': 38000,
    '500': 72000,
    '1000': 135000
  },
  sizeLabels: { '250': '250 g', '500': '500 g', '1000': '1 kg' },
  storageKey: 'dscatcoff_cart'
};

/* ==========================================================
   Utilidades
   ========================================================== */
const $ = (sel) => document.querySelector(sel);
const money = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

/* ==========================================================
   Estado
   ========================================================== */
let qty = 1;
let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart));
  } catch (e) { /* si el navegador bloquea el almacenamiento, el carrito sigue funcionando en memoria */ }
}

/* ==========================================================
   Selector de producto
   ========================================================== */
const priceEl = $('#price');
const qtyEl = $('#qtyValue');

function selected(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function updatePrice() {
  priceEl.textContent = money.format(CONFIG.prices[selected('size')]);
}

document.querySelectorAll('input[name="size"]').forEach((r) => r.addEventListener('change', updatePrice));

$('#qtyMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; });
$('#qtyPlus').addEventListener('click', () => { qty = Math.min(20, qty + 1); qtyEl.textContent = qty; });

$('#addToCart').addEventListener('click', () => {
  const size = selected('size');
  const grind = selected('grind');
  const key = `${size}-${grind}`;
  const existing = cart.find((i) => i.key === key);

  if (existing) {
    existing.qty = Math.min(50, existing.qty + qty);
  } else {
    cart.push({ key, size, grind, qty });
  }

  saveCart();
  renderCart();
  bumpCount();
  showToast(`${qty} × ${CONFIG.productName} ${CONFIG.sizeLabels[size]} agregado al carrito`);
  qty = 1;
  qtyEl.textContent = qty;
});

/* ==========================================================
   Carrito
   ========================================================== */
const drawer = $('#drawer');
const overlay = $('#overlay');
const listEl = $('#cartList');
const emptyEl = $('#cartEmpty');
const totalEl = $('#cartTotal');
const countEl = $('#cartCount');
const checkoutBtn = $('#checkout');

function cartTotal() {
  return cart.reduce((sum, i) => sum + CONFIG.prices[i.size] * i.qty, 0);
}

function renderCart() {
  listEl.innerHTML = '';

  cart.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div>
        <strong>${CONFIG.productName}</strong>
        <small>${CONFIG.sizeLabels[item.size]} · ${item.grind}</small>
      </div>
      <span class="line-price">${money.format(CONFIG.prices[item.size] * item.qty)}</span>
      <div class="item-controls">
        <button type="button" data-act="minus" aria-label="Restar uno">−</button>
        <span>${item.qty}</span>
        <button type="button" data-act="plus" aria-label="Sumar uno">+</button>
        <button type="button" class="remove" data-act="remove">Quitar</button>
      </div>`;

    li.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (!act) return;
      if (act === 'plus') item.qty = Math.min(50, item.qty + 1);
      if (act === 'minus') item.qty -= 1;
      if (act === 'remove' || item.qty <= 0) cart = cart.filter((i) => i.key !== item.key);
      saveCart();
      renderCart();
    });

    listEl.appendChild(li);
  });

  const count = cart.reduce((n, i) => n + i.qty, 0);
  countEl.textContent = count;
  totalEl.textContent = money.format(cartTotal());
  emptyEl.hidden = cart.length > 0;
  checkoutBtn.disabled = cart.length === 0;
}

function bumpCount() {
  countEl.classList.remove('bump');
  void countEl.offsetWidth; // reinicia la animación
  countEl.classList.add('bump');
}

function openCart() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#closeCart').focus();
}

function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  document.body.style.overflow = '';
  $('#openCart').focus();
}

$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart();
});

$('#clearCart').addEventListener('click', () => {
  cart = [];
  saveCart();
  renderCart();
});

/* ==========================================================
   Pedido por WhatsApp
   ========================================================== */
checkoutBtn.addEventListener('click', () => {
  if (!cart.length) return;

  const lines = cart.map((i) =>
    `• ${i.qty} × ${CONFIG.productName} ${CONFIG.sizeLabels[i.size]} (${i.grind}) – ${money.format(CONFIG.prices[i.size] * i.qty)}`
  );

  const message = [
    'Hola Dscat Coff, quiero hacer este pedido:',
    '',
    ...lines,
    '',
    `Total: ${money.format(cartTotal())}`,
    '',
    'Mi nombre y dirección de envío:'
  ].join('\n');

  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
});

/* ==========================================================
   Aviso
   ========================================================== */
let toastTimer;
function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ==========================================================
   Inicio
   ========================================================== */
$('#year').textContent = new Date().getFullYear();
updatePrice();
renderCart();
