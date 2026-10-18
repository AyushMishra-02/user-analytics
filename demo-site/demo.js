// Demo Store Interactive Controller & Live Analytics HUD

let cart = JSON.parse(localStorage.getItem('cf_demo_cart') || '[]');
let eventCounter = 0;

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const totalCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    badge.innerText = totalCount;
  }
}

function showToast(message) {
  let toast = document.getElementById('cfToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cfToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function addToCart(title, price, icon) {
  const existing = cart.find((i) => i.title === title);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ title, price, icon, quantity: 1 });
  }
  localStorage.setItem('cf_demo_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(`Added "${title}" to Cart!`);
}

function clearCart() {
  cart = [];
  localStorage.removeItem('cf_demo_cart');
  updateCartBadge();
  renderCart();
  showToast('Cart cleared');
}

function renderCart() {
  const itemsContainer = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('subtotalPrice');
  const totalEl = document.getElementById('totalPrice');

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Your cart is empty. Explore products!</p>';
    if (subtotalEl) subtotalEl.innerText = '$0.00';
    if (totalEl) totalEl.innerText = '$0.00';
    return;
  }

  let subtotal = 0;
  itemsContainer.innerHTML = cart
    .map((item, idx) => {
      const priceNum = parseFloat(item.price.replace('$', '')) || 0;
      subtotal += priceNum * (item.quantity || 1);
      return `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon || '📦'}</div>
        <div class="cart-item-info">
          <div style="font-weight: 700; color: #fff;">${item.title}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">Qty: ${item.quantity || 1} &bull; ${item.price}</div>
        </div>
        <div style="font-weight: 800; color: #fff;">$${(priceNum * (item.quantity || 1)).toFixed(2)}</div>
      </div>
    `;
    })
    .join('');

  if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
  if (totalEl) totalEl.innerText = `$${(subtotal > 0 ? subtotal + 9.99 : 0).toFixed(2)}`;
}

// Setup Tracking HUD in the corner of demo pages
function injectTrackingHUD() {
  if (document.getElementById('trackingHudWidget')) return;

  const hud = document.createElement('div');
  hud.id = 'trackingHudWidget';
  hud.className = 'tracking-hud';

  const sid = (window.CausalTracker && window.CausalTracker.getSessionId()) || 'Initializing...';

  hud.innerHTML = `
    <div class="hud-header">
      <div class="hud-title">
        <span class="hud-pulse"></span>
        <span>CausalFunnel Tracker</span>
      </div>
      <span id="hudEventCounter" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0.1rem 0.5rem; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;">0 events</span>
    </div>
    <div class="hud-info">
      <div><strong>Session ID:</strong></div>
      <div id="hudSessionIdText" style="color: #38bdf8;">${sid}</div>
    </div>
    <div class="hud-actions">
      <button class="hud-btn" id="hudNewSessionBtn">🔄 New Session</button>
      <button class="hud-btn" id="hudSimulateTrafficBtn">⚡ Simulate 5 Clicks</button>
      <a href="http://localhost:5173" target="_blank" class="hud-btn primary">📊 Open Dashboard &rarr;</a>
    </div>
  `;

  document.body.appendChild(hud);

  // Hook tracker onEvent to update HUD
  if (window.CausalTracker && window.CausalTracker.onEvent) {
    window.CausalTracker.onEvent((ev) => {
      eventCounter++;
      const counterEl = document.getElementById('hudEventCounter');
      if (counterEl) counterEl.innerText = `${eventCounter} tracked`;

      // Flash green indicator
      const pulseEl = document.querySelector('.hud-pulse');
      if (pulseEl) {
        pulseEl.style.boxShadow = '0 0 20px #10b981';
        setTimeout(() => {
          pulseEl.style.boxShadow = '0 0 10px #10b981';
        }, 300);
      }
    });
  }

  // Bind New Session
  document.getElementById('hudNewSessionBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.CausalTracker && window.CausalTracker.resetSession) {
      const newSid = window.CausalTracker.resetSession();
      const sidEl = document.getElementById('hudSessionIdText');
      if (sidEl) sidEl.innerText = newSid;
      showToast('New Session Generated: ' + newSid.slice(0, 14) + '...');
      if (window.CausalTracker.trackPageView) {
        window.CausalTracker.trackPageView();
      }
    }
  });

  // Bind Traffic Simulation
  document.getElementById('hudSimulateTrafficBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    simulateClicks();
  });
}

function simulateClicks() {
  if (!window.CausalTracker) return;
  showToast('Simulating realistic clicks...');

  const elements = [
    { tag: 'BUTTON', text: 'Shop Now Banner', x: 500, y: 320 },
    { tag: 'DIV', text: 'Wireless Earbuds Pro', x: 380, y: 550 },
    { tag: 'BUTTON', text: 'Add to Cart Quick', x: 740, y: 560 },
    { tag: 'A', text: 'Top Deals Filter', x: 280, y: 210 },
    { tag: 'BUTTON', text: 'Cart Drawer Button', x: 1120, y: 40 },
  ];

  elements.forEach((item, index) => {
    setTimeout(() => {
      window.CausalTracker.track('click', {
        clickX: item.x + Math.floor(Math.random() * 30 - 15),
        clickY: item.y + Math.floor(Math.random() * 20 - 10),
        elementTag: item.tag,
        elementText: item.text,
      });
    }, index * 250);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCart();
  setTimeout(injectTrackingHUD, 300);
});
