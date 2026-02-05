/**
 * Collection Filters JavaScript - COMPLETE FIXED v3
 * Simple price filter with input fields only
 * No conversion issues
 */

const CollectionFilters = {
  
  priceTimeout: null,
  
  init() {
    this.productsContainer = document.querySelector('.collection-products');
    this.productsGrid = document.querySelector('#products-grid');
    this.filterContent = document.querySelector('#filter-content');
    
    this.bindEvents();
    this.initPriceInputs();
    this.initGridFromStorage();
    
    console.log('CollectionFilters initialized');
  },

  bindEvents() {
    const filterToggle = document.querySelector('#filter-toggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', this.handleMobileToggle.bind(this));
    }

    document.querySelectorAll('.filter-group__toggle').forEach(toggle => {
      toggle.addEventListener('click', this.handleGroupToggle.bind(this));
    });

    const sortSelect = document.querySelector('[data-sort-select]');
    if (sortSelect) {
      sortSelect.addEventListener('change', this.handleSortChange.bind(this));
    }

    document.querySelectorAll('.grid-toggle__btn').forEach(btn => {
      btn.addEventListener('click', this.handleGridToggle.bind(this));
    });

    this.bindSwatchEvents();
    this.bindQuickAddEvents();

    const loadMoreBtn = document.querySelector('[data-load-more]');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
    }

    window.addEventListener('popstate', () => {
      window.location.reload();
    });
  },

  /**
   * Simple price inputs - auto apply after typing
   * Scoped per .filter-price-range so it still works after AJAX updates
   */
  initPriceInputs() {
    document.querySelectorAll('.filter-price-range').forEach(range => {
      const minName = range.dataset.minName;
      const maxName = range.dataset.maxName;

      const minInput = range.querySelector(`input[name="${minName}"]`);
      const maxInput = range.querySelector(`input[name="${maxName}"]`);

      const applyForThisRange = () => {
        this.applyPriceFilter(range);
      };

      if (minInput) {
        // Clone to avoid stacking multiple listeners on AJAX rebind
        const cloneMin = minInput.cloneNode(true);
        minInput.parentNode.replaceChild(cloneMin, minInput);

        cloneMin.addEventListener('change', applyForThisRange);
        cloneMin.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyForThisRange();
          }
        });
      }

      if (maxInput) {
        const cloneMax = maxInput.cloneNode(true);
        maxInput.parentNode.replaceChild(cloneMax, maxInput);

        cloneMax.addEventListener('change', applyForThisRange);
        cloneMax.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyForThisRange();
          }
        });
      }
    });
  },

  /**
   * Apply price filter
   * Takes the values for a specific .filter-price-range
   * Multiplies by 100 for Shopify (cents)
   */
 applyPriceFilter(rangeEl) {
  const priceRange = rangeEl || document.querySelector('.filter-price-range');
  if (!priceRange) return;

  const minName = priceRange.dataset.minName;
  const maxName = priceRange.dataset.maxName;

  const inputMin = priceRange.querySelector(`input[name="${minName}"]`);
  const inputMax = priceRange.querySelector(`input[name="${maxName}"]`);

  if (!inputMin && !inputMax) return;

  // Read user input (major currency units, e.g. 2, 10, 19.99)
  const rawMin = inputMin && inputMin.value ? inputMin.value.trim() : '';
  const rawMax = inputMax && inputMax.value ? inputMax.value.trim() : '';

  // Normalise commas to dots, then parse
  const minValue = rawMin ? parseFloat(rawMin.replace(',', '.')) : 0;
  const maxValue = rawMax ? parseFloat(rawMax.replace(',', '.')) : 0;

  const params = new URLSearchParams(window.location.search);

  // Remove existing price params
  const cleanedParams = new URLSearchParams();
  params.forEach((value, key) => {
    if (!key.includes('price')) {
      cleanedParams.append(key, value);
    }
  });

  // Add price params in *major* units (no x100)
  if (minValue > 0) {
    cleanedParams.set(minName, String(minValue));
  }
  if (maxValue > 0 && (!minValue || maxValue >= minValue)) {
    cleanedParams.set(maxName, String(maxValue));
  }

  const queryString = cleanedParams.toString();
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  console.log('Price filter URL:', newUrl);
  this.fetchAndRender(newUrl);
}
,

  handleCheckboxChange(checkbox) {
    console.log('Checkbox changed:', checkbox.name, checkbox.value, checkbox.checked);
    
    let url;
    if (checkbox.checked) {
      url = checkbox.dataset.filterUrl;
    } else {
      url = checkbox.dataset.filterUrlRemove;
    }

    if (url) {
      this.fetchAndRender(url);
    } else {
      this.buildAndSubmitFilters();
    }
  },

  handleRemoveFilter(e, element) {
    e.preventDefault();
    const url = element.getAttribute('href');
    if (url) {
      this.fetchAndRender(url);
    }
  },

  handleClearAll(e, element) {
    e.preventDefault();
    const url = element.getAttribute('href');
    if (url) {
      this.fetchAndRender(url);
    }
  },

  buildAndSubmitFilters() {
    const params = new URLSearchParams();
    
    const sortSelect = document.querySelector('[data-sort-select]');
    if (sortSelect && sortSelect.value) {
      params.set('sort_by', sortSelect.value);
    }

    document.querySelectorAll('.filter-checkbox input:checked').forEach(checkbox => {
      if (checkbox.name && checkbox.value) {
        params.append(checkbox.name, checkbox.value);
      }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    this.fetchAndRender(newUrl);
  },

  handleMobileToggle(e) {
    const toggle = e.currentTarget;
    const content = document.querySelector('#filter-content');
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    toggle.setAttribute('aria-expanded', !isExpanded);
    content.classList.toggle('is-open', !isExpanded);
  },

  handleGroupToggle(e) {
    e.preventDefault();
    const toggle = e.currentTarget;
    const content = toggle.nextElementSibling;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    toggle.setAttribute('aria-expanded', !isExpanded);
    content.classList.toggle('is-open', !isExpanded);
  },

  handleSortChange(e) {
    const sortBy = e.target.value;
    const params = new URLSearchParams(window.location.search);
    params.set('sort_by', sortBy);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    this.fetchAndRender(newUrl);
  },

  async fetchAndRender(url) {
    console.log('Fetching:', url);
    
    if (this.productsContainer) {
      this.productsContainer.classList.add('is-loading');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newGrid = doc.querySelector('#products-grid');
      if (newGrid && this.productsGrid) {
        this.productsGrid.innerHTML = newGrid.innerHTML;
      }

      const newFilters = doc.querySelector('#filter-content');
      const currentFilters = document.querySelector('#filter-content');
      if (newFilters && currentFilters) {
        currentFilters.innerHTML = newFilters.innerHTML;
      }

      const newCount = doc.querySelector('.collection-toolbar__count');
      const currentCount = document.querySelector('.collection-toolbar__count');
      if (newCount && currentCount) {
        currentCount.textContent = newCount.textContent;
      }

      const newPagination = doc.querySelector('.collection-pagination');
      const currentPagination = document.querySelector('.collection-pagination');
      if (currentPagination) {
        currentPagination.innerHTML = newPagination ? newPagination.innerHTML : '';
      }

      history.pushState({}, '', url);
      this.rebindEvents();

      if (this.productsContainer) {
        this.productsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (error) {
      console.error('Filter error:', error);
      window.location.href = url;
    } finally {
      if (this.productsContainer) {
        this.productsContainer.classList.remove('is-loading');
      }
    }
  },

  rebindEvents() {
    document.querySelectorAll('.filter-group__toggle').forEach(toggle => {
      toggle.removeEventListener('click', this.handleGroupToggle);
      toggle.addEventListener('click', this.handleGroupToggle.bind(this));
    });

    // Price inputs and other dynamic bits need re-initialising after HTML swap
    this.initPriceInputs();
    this.bindSwatchEvents();
    this.bindQuickAddEvents();

    const loadMoreBtn = document.querySelector('[data-load-more]');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
    }
  },

  handleGridToggle(e) {
    const btn = e.currentTarget;
    const cols = btn.dataset.gridCols;

    document.querySelectorAll('.grid-toggle__btn').forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');

    if (this.productsGrid) {
      this.productsGrid.style.setProperty('--grid-cols', cols);
    }

    localStorage.setItem('collection-grid-cols', cols);
  },

  initGridFromStorage() {
    const savedCols = localStorage.getItem('collection-grid-cols');
    if (savedCols && this.productsGrid) {
      this.productsGrid.style.setProperty('--grid-cols', savedCols);
      
      document.querySelectorAll('.grid-toggle__btn').forEach(btn => {
        const isActive = btn.dataset.gridCols === savedCols;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
  },

  bindSwatchEvents() {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', this.handleSwatchClick.bind(this));
      swatch.addEventListener('mouseenter', this.handleSwatchHover.bind(this));
      swatch.addEventListener('mouseleave', this.handleSwatchLeave.bind(this));
    });
  },

  handleSwatchClick(e) {
    const swatch = e.currentTarget;
    const container = swatch.closest('.product-card__swatches, .color-swatches');
    const card = swatch.closest('.product-card');
    
    if (container) {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('is-active'));
      swatch.classList.add('is-active');
    }

    const variantImage = swatch.dataset.variantImage;
    if (variantImage && card) {
      const img = card.querySelector('.product-card__image--primary');
      if (img) img.src = variantImage;
    }

    const variantId = swatch.dataset.variantId;
    if (variantId && card) {
      const quickAddBtn = card.querySelector('.product-card__quick-add');
      if (quickAddBtn) quickAddBtn.dataset.variantId = variantId;
    }
  },

  handleSwatchHover(e) {
    const swatch = e.currentTarget;
    const card = swatch.closest('.product-card');
    const variantImage = swatch.dataset.variantImage;
    
    if (variantImage && card) {
      const img = card.querySelector('.product-card__image--primary');
      if (img) {
        img.dataset.originalSrc = img.dataset.originalSrc || img.src;
        img.src = variantImage;
      }
    }
  },

  handleSwatchLeave(e) {
    const swatch = e.currentTarget;
    if (swatch.classList.contains('is-active')) return;
    
    const card = swatch.closest('.product-card');
    if (!card) return;
    
    const activeSwatch = card.querySelector('.color-swatch.is-active');
    const img = card.querySelector('.product-card__image--primary');
    
    if (img) {
      if (activeSwatch && activeSwatch.dataset.variantImage) {
        img.src = activeSwatch.dataset.variantImage;
      } else if (img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
      }
    }
  },

  bindQuickAddEvents() {
    document.querySelectorAll('.product-card__quick-add').forEach(btn => {
      btn.addEventListener('click', this.handleQuickAdd.bind(this));
    });
  },

  async handleQuickAdd(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const variantId = btn.dataset.variantId;
    
    if (!variantId) return;

    btn.disabled = true;
    btn.classList.add('is-loading');
    const originalHtml = btn.innerHTML;

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: parseInt(variantId, 10),
          quantity: 1
        })
      });

      if (!response.ok) throw new Error('Add to cart failed');

      const data = await response.json();
      
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
      document.dispatchEvent(new CustomEvent('cart:item-added', { detail: data }));

      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 10L8 14L16 6" stroke="currentColor" stroke-width="2" fill="none"/></svg><span>Added!</span>';
      
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }, 1500);

    } catch (error) {
      console.error('Quick add error:', error);
      btn.innerHTML = '<span>Error</span>';
      
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }, 2000);
    }
  },

  async handleLoadMore(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const nextUrl = btn.dataset.nextUrl;
    
    if (!nextUrl) return;

    btn.disabled = true;
    btn.classList.add('is-loading');

    try {
      const response = await fetch(nextUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newProducts = doc.querySelectorAll('.product-grid__item');
      newProducts.forEach(product => {
        this.productsGrid.appendChild(product);
      });

      const newPagination = doc.querySelector('.collection-pagination');
      const currentPagination = document.querySelector('.collection-pagination');
      
      if (currentPagination) {
        if (newPagination) {
          currentPagination.innerHTML = newPagination.innerHTML;
          const newLoadMore = currentPagination.querySelector('[data-load-more]');
          if (newLoadMore) {
            newLoadMore.addEventListener('click', this.handleLoadMore.bind(this));
          }
        } else {
          currentPagination.remove();
        }
      }

      this.bindSwatchEvents();
      this.bindQuickAddEvents();

      history.replaceState({}, '', nextUrl);

    } catch (error) {
      console.error('Load more error:', error);
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CollectionFilters.init());
} else {
  CollectionFilters.init();
}

document.addEventListener('shopify:section:load', (e) => {
  if (e.target.querySelector('.collection-wrapper')) {
    CollectionFilters.init();
  }
});

window.CollectionFilters = CollectionFilters;
