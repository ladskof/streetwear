/* ============================================================
   STREET CULT — Main JavaScript
   Vanilla JS only. No frameworks.
   Features:
     - Cart with localStorage persistence
     - Navbar cart counter sync
     - Product gallery thumbnail switching
     - Size & color selection states
     - Quantity +/- controls
     - Add-to-cart with toast notification
     - Scroll-to-top button
     - Filter chip toggles (shop page)
     - Tab switching (product page)
     - Newsletter form handling
     - Contact form handling
   ============================================================ */

'use strict';

/* ── CART STORE ──────────────────────────────────────────────── */
const Cart = (() => {
  const KEY = 'streetcult_cart';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function getItems() {
    return load();
  }

  function getCount() {
    return load().reduce((sum, item) => sum + item.qty, 0);
  }

  function getTotal() {
    return load().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function addItem(product) {
    const items = load();
    const existing = items.find(
      i => i.id === product.id && i.size === product.size && i.color === product.color
    );
    if (existing) {
      existing.qty = Math.min(existing.qty + (product.qty || 1), 99);
    } else {
      items.push({ ...product, qty: product.qty || 1 });
    }
    save(items);
    return items;
  }

  function removeItem(id, size, color) {
    const items = load().filter(
      i => !(i.id === id && i.size === size && i.color === color)
    );
    save(items);
    return items;
  }

  function updateQty(id, size, color, qty) {
    const items = load();
    const item = items.find(
      i => i.id === id && i.size === size && i.color === color
    );
    if (item) {
      if (qty < 1) {
        return removeItem(id, size, color);
      }
      item.qty = Math.min(qty, 99);
    }
    save(items);
    return items;
  }

  function clear() {
    save([]);
  }

  return { getItems, getCount, getTotal, addItem, removeItem, updateQty, clear };
})();

/* ── HELPERS ─────────────────────────────────────────────────── */
function $(selector, scope) {
  return (scope || document).querySelector(selector);
}

function $$(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

/* ── TOAST NOTIFICATION ──────────────────────────────────────── */
function showToast(message, duration) {
  duration = duration || 2800;
  let toast = $('.toast');

  // Create toast element if it doesn't exist
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <span class="toast__icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </span>
      <span class="toast__text"></span>
    `;
    document.body.appendChild(toast);
  }

  $('.toast__text', toast).textContent = message;
  toast.classList.add('is-visible');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, duration);
}

/* ── CART COUNT BADGE ────────────────────────────────────────── */
function updateCartBadges() {
  const count = Cart.getCount();
  $$('.nav__cart-count').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ── SCROLL TO TOP ───────────────────────────────────────────── */
function initScrollTop() {
  const btn = $('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── ACTIVE NAV LINK ─────────────────────────────────────────── */
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link, .nav__link--desktop').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });
}

/* ── PRODUCT GALLERY ─────────────────────────────────────────── */
function initProductGallery() {
  const mainImg = $('.product-gallery__main img');
  const thumbs  = $$('.product-gallery__thumb');
  if (!mainImg || !thumbs.length) return;

  thumbs.forEach((thumb, i) => {
    if (i === 0) thumb.classList.add('is-active');

    thumb.addEventListener('click', () => {
      const src = thumb.querySelector('img').src;
      const alt = thumb.querySelector('img').alt;

      // Fade transition
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = src;
        mainImg.alt = alt;
        mainImg.style.opacity = '1';
      }, 180);

      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });

    // Keyboard support
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('role', 'button');
  });

  // Smooth opacity transition on main image
  mainImg.style.transition = 'opacity 0.18s ease';
}

/* ── SIZE SELECTOR ───────────────────────────────────────────── */
function initSizeSelector() {
  const btns = $$('.size-selector__btn:not(.is-disabled)');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });
}

/* ── COLOR SWATCHES ──────────────────────────────────────────── */
function initColorSwatches() {
  const swatches = $$('.color-swatch');
  if (!swatches.length) return;

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('is-selected'));
      swatch.classList.add('is-selected');
    });
  });
}

/* ── QUANTITY CONTROLS ───────────────────────────────────────── */
function initQtyControls() {
  $$('.qty-control').forEach(control => {
    const valueEl = $('.qty-control__value', control);
    const decBtn  = control.querySelector('[data-qty="dec"]');
    const incBtn  = control.querySelector('[data-qty="inc"]');
    if (!valueEl || !decBtn || !incBtn) return;

    let qty = parseInt(valueEl.textContent, 10) || 1;

    decBtn.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        valueEl.textContent = qty;
        control.dispatchEvent(new CustomEvent('qty:change', { detail: { qty }, bubbles: true }));
      }
    });

    incBtn.addEventListener('click', () => {
      if (qty < 99) {
        qty++;
        valueEl.textContent = qty;
        control.dispatchEvent(new CustomEvent('qty:change', { detail: { qty }, bubbles: true }));
      }
    });
  });
}

/* ── ADD TO CART (product.html) ──────────────────────────────── */
function initAddToCart() {
  const addBtn = $('#add-to-cart-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const name  = $('#product-name')    ? $('#product-name').textContent.trim()  : 'Product';
    const price = $('#product-price')   ? parseInt($('#product-price').dataset.cents || '18900', 10) : 18900;
    const img   = $('.product-gallery__main img') ? $('.product-gallery__main img').src : '';
    const brand = $('#product-brand')   ? $('#product-brand').textContent.trim() : '';

    const selectedSize  = $('.size-selector__btn.is-selected');
    const selectedColor = $('.color-swatch.is-selected');
    const qtyEl         = $('.qty-control__value');

    if (!selectedSize) {
      showToast('Please select a size first.', 2200);
      return;
    }

    const size  = selectedSize.textContent.trim();
    const color = selectedColor ? selectedColor.dataset.color : 'Default';
    const qty   = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;

    Cart.addItem({
      id:    name.toLowerCase().replace(/\s+/g, '-') + '-' + size + '-' + color,
      name, brand, price, img, size, color, qty
    });

    updateCartBadges();
    showToast(`${name} (${size}) added to cart!`);
  });
}

/* ── QUICK ADD BUTTONS (cards on index/shop) ─────────────────── */
function initQuickAdd() {
  $$('.js-quick-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const card  = btn.closest('[data-product]');
      const name  = card ? card.dataset.product  : 'Product';
      const price = card ? parseInt(card.dataset.price || '14900', 10) : 14900;
      const img   = card ? card.querySelector('img')?.src || '' : '';

      Cart.addItem({
        id:    name.toLowerCase().replace(/\s+/g, '-') + '-OS-Default',
        name, brand: 'Street Cult', price, img,
        size: 'OS', color: 'Default', qty: 1
      });

      updateCartBadges();
      showToast(`${name} added to cart!`);

      // Animate the button
      btn.textContent = '✓ Added';
      btn.style.background = 'var(--accent)';
      setTimeout(() => {
        btn.textContent = 'Quick Add';
        btn.style.background = '';
      }, 2000);
    });
  });
}

/* ── WISHLIST TOGGLE ─────────────────────────────────────────── */
function initWishlist() {
  $$('.product-card__wishlist').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('is-active');
      const isActive = btn.classList.contains('is-active');
      btn.setAttribute('aria-pressed', isActive);
      showToast(isActive ? 'Added to wishlist ♥' : 'Removed from wishlist', 2000);
    });
  });
}

/* ── PRODUCT TABS ────────────────────────────────────────────── */
function initProductTabs() {
  const tabs   = $$('.product-tab');
  const panels = $$('.product-tab-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('is-active'));

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const panel = $(`#tab-${target}`);
      if (panel) panel.classList.add('is-active');
    });
  });

  // Activate first tab
  if (tabs[0]) tabs[0].click();
}

/* ── CART PAGE ───────────────────────────────────────────────── */
function initCartPage() {
  const cartWrap  = $('#cart-items-wrap');
  const emptyCart = $('#empty-cart');
  const summaryWrap = $('#cart-summary-wrap');
  if (!cartWrap) return;

  function renderCart() {
    const items = Cart.getItems();
    cartWrap.innerHTML = '';

    if (!items.length) {
      if (emptyCart)  emptyCart.style.display = 'block';
      if (summaryWrap) summaryWrap.style.display = 'none';
      return;
    }

    if (emptyCart)  emptyCart.style.display = 'none';
    if (summaryWrap) summaryWrap.style.display = '';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item__img">
          <img src="${item.img || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'}"
               alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item__info">
          <p class="cart-item__brand">${item.brand || 'Street Cult'}</p>
          <h3 class="cart-item__name">${item.name}</h3>
          <div class="cart-item__meta">
            <span>Size: ${item.size}</span>
            <span>Color: ${item.color}</span>
          </div>
          <div class="qty-control" style="margin-top:var(--space-3)"
               data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
            <button class="qty-control__btn" data-qty="dec" aria-label="Decrease quantity">−</button>
            <span class="qty-control__value">${item.qty}</span>
            <button class="qty-control__btn" data-qty="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item__price-col">
          <span class="cart-item__price">${formatPrice(item.price * item.qty)}</span>
          <button class="cart-item__remove js-remove-item"
                  data-id="${item.id}" data-size="${item.size}" data-color="${item.color}"
                  aria-label="Remove ${item.name}">
            Remove
          </button>
        </div>
      `;
      cartWrap.appendChild(el);
    });

    // Re-init qty controls for rendered items
    $$('.qty-control', cartWrap).forEach(control => {
      const valueEl = $('.qty-control__value', control);
      const decBtn  = control.querySelector('[data-qty="dec"]');
      const incBtn  = control.querySelector('[data-qty="inc"]');
      const id    = control.dataset.id;
      const size  = control.dataset.size;
      const color = control.dataset.color;

      decBtn.addEventListener('click', () => {
        const current = parseInt(valueEl.textContent, 10);
        Cart.updateQty(id, size, color, current - 1);
        renderCart();
        updateCartSummary();
        updateCartBadges();
      });

      incBtn.addEventListener('click', () => {
        const current = parseInt(valueEl.textContent, 10);
        Cart.updateQty(id, size, color, current + 1);
        renderCart();
        updateCartSummary();
        updateCartBadges();
      });
    });

    // Remove buttons
    $$('.js-remove-item', cartWrap).forEach(btn => {
      btn.addEventListener('click', () => {
        Cart.removeItem(btn.dataset.id, btn.dataset.size, btn.dataset.color);
        renderCart();
        updateCartSummary();
        updateCartBadges();
        showToast('Item removed from cart.', 2000);
      });
    });

    updateCartSummary();
  }

  function updateCartSummary() {
    const total   = Cart.getTotal();
    const subtotal = $('#summary-subtotal');
    const shipping = $('#summary-shipping');
    const totalEl  = $('#summary-total');
    if (subtotal) subtotal.textContent = formatPrice(total);
    if (shipping) shipping.textContent = total >= 10000 ? 'FREE' : '$8.99';
    if (totalEl) {
      const ship = total >= 10000 ? 0 : 899;
      totalEl.textContent = formatPrice(total + ship);
    }
  }

  renderCart();

  // Promo code
  const promoBtn = $('#apply-promo');
  const promoInput = $('#promo-input');
  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'STREET10') {
        showToast('Promo code applied! 10% off your order.', 3000);
        promoInput.value = '';
        promoInput.style.borderColor = 'var(--accent)';
      } else if (code) {
        showToast('Invalid promo code. Try STREET10.', 2500);
        promoInput.style.borderColor = '#FF4444';
        setTimeout(() => { promoInput.style.borderColor = ''; }, 2000);
      }
    });
    promoInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') promoBtn.click();
    });
  }

  // Checkout button
  const checkoutBtn = $('#checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (Cart.getCount() === 0) {
        showToast('Your cart is empty!', 2000);
        return;
      }
      showToast('Redirecting to checkout... (demo)', 3000);
    });
  }
}

/* ── FILTER CHIPS (shop page) ────────────────────────────────── */
function initFilterChips() {
  $$('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      if (group) {
        $$(`[data-filter][data-group="${group}"]`).forEach(c => c.classList.remove('is-active'));
      }
      chip.classList.toggle('is-active');
    });
  });
}

/* ── SIZE FILTER BUTTONS (shop sidebar) ─────────────────────── */
function initSizeFilters() {
  $$('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-active');
    });
  });
}

/* ── NEWSLETTER FORM ─────────────────────────────────────────── */
function initNewsletter() {
  $$('.newsletter__form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('.newsletter__input');
      if (!input || !input.value.trim()) return;
      showToast(`Welcome to the cult, ${input.value.split('@')[0]}! 🔥`, 3500);
      input.value = '';
    });
  });
}

/* ── CONTACT FORM ────────────────────────────────────────────── */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nameEl  = $('#contact-name');
    const emailEl = $('#contact-email');
    const msgEl   = $('#contact-message');

    if (!nameEl.value.trim() || !emailEl.value.trim() || !msgEl.value.trim()) {
      showToast('Please fill in all required fields.', 2500);
      return;
    }

    // Simulate submission
    const btn = form.querySelector('[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
      form.reset();
      btn.textContent = original;
      btn.disabled = false;
      showToast('Message sent! We\'ll be in touch shortly. ✓', 3500);
    }, 1400);
  });
}

/* ── HERO PARALLAX (subtle, requestAnimationFrame) ───────────── */
function initParallax() {
  const heroBg = $('.hero__bg img');
  if (!heroBg) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        heroBg.style.transform = `translateY(${scrolled * 0.25}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── STICKY NAV SCROLL EFFECT ─────────────────────────────────── */
function initNavScroll() {
  const nav = $('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(13, 13, 13, 0.98)';
      nav.style.borderBottomColor = 'var(--border-light)';
    } else {
      nav.style.background = 'rgba(13, 13, 13, 0.92)';
      nav.style.borderBottomColor = 'var(--border)';
    }
  }, { passive: true });
}

/* ── INTERSECTION OBSERVER — fade-in on scroll ───────────────── */
function initFadeIn() {
  const elements = $$('[data-fade]');
  if (!elements.length || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    observer.observe(el);
  });

  // Add style for is-visible
  const style = document.createElement('style');
  style.textContent = '[data-fade].is-visible { opacity: 1 !important; transform: none !important; }';
  document.head.appendChild(style);
}

/* ── INIT ON DOM READY ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Universal
  updateCartBadges();
  setActiveNav();
  initScrollTop();
  initNavScroll();
  initFadeIn();
  initQuickAdd();
  initWishlist();
  initNewsletter();
  initFilterChips();
  initSizeFilters();

  // Page-specific
  initProductGallery();
  initSizeSelector();
  initColorSwatches();
  initQtyControls();
  initAddToCart();
  initProductTabs();
  initCartPage();
  initContactForm();
  initParallax();
});
