/**
 * Premium Customer Menu Logic
 */

// Global State
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('r');

let restaurant = null;
let categories = [];
let products = [];
let currentLang = 'ar';
let selectedCategoryId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!restaurantId) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;"><h1>❌ الرابط غير صالح</h1></div>';
        return;
    }

    await initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    // 1. Load Restaurant Settings
    const { data: resData } = await RestaurantService.getRestaurantById(restaurantId);
    if (!resData) return;

    restaurant = resData;
    currentLang = restaurant.default_language || 'ar';
    updateThemeAndMeta();

    // 2. Load Categories & Products
    const [catsRes, prodsRes] = await Promise.all([
        CategoryService.getCategories(restaurantId, true),
        ProductService.getProducts(restaurantId)
    ]);

    if (catsRes.data) categories = catsRes.data;
    if (prodsRes.data) products = prodsRes.data;

    // 3. Set Default Category (First one)
    if (categories.length > 0) {
        selectedCategoryId = categories[0].id;
    }

    renderMenu();
}

function updateThemeAndMeta() {
    document.title = `${restaurant.name} - المنيو`;
    document.getElementById('restaurantName').textContent = restaurant.name;
    document.getElementById('subBrand').textContent = currentLang === 'ar' ? 'بيتزا وقهوة مختصة' : 'Pizza & Specialty Coffee';

    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langToggle').textContent = currentLang === 'ar' ? 'ENGLISH' : 'عربي';
}

// ==================== Rendering ====================

function renderMenu() {
    renderTabs();
    updateCategoryHeader();
    renderProducts();
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';

    categories.forEach(cat => {
        const isActive = selectedCategoryId === cat.id;
        const btn = document.createElement('button');
        btn.className = `dial-item ${isActive ? 'active' : ''}`;
        btn.onclick = () => switchCategory(cat.id);

        btn.innerHTML = `
            <div class="dial-icon">${cat.icon || '📂'}</div>
            <span class="dial-label">${currentLang === 'ar' ? cat.name : (cat.name_en || cat.name)}</span>
        `;
        container.appendChild(btn);

        // Auto-scroll to active tab
        if (isActive) {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    });
}

function updateCategoryHeader() {
    const cat = categories.find(c => c.id === selectedCategoryId);
    if (!cat) return;

    const bgTitle = document.getElementById('bgCatTitle');
    const headerIcon = document.getElementById('headerIcon');
    const arName = document.getElementById('selectedCatArName');

    bgTitle.textContent = (cat.name_en || cat.name).toUpperCase();
    headerIcon.textContent = cat.icon || '📂';
    arName.textContent = currentLang === 'ar' ? cat.name : (cat.name_en || cat.name);
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    const filtered = products.filter(p => p.category_id === selectedCategoryId);

    // Add animation class
    container.classList.remove('animate-in');
    void container.offsetWidth; // trigger reflow
    container.classList.add('animate-in');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 4rem 1rem; opacity: 0.3;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🍽️</div>
                <div style="text-transform: uppercase; letter-spacing: 0.2em;">
                    ${currentLang === 'ar' ? 'قريباً في القائمة' : 'Coming Soon'}
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    filtered.forEach((product, idx) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${idx * 0.05}s`;
        card.onclick = () => showProductDetails(product);

        const name = currentLang === 'ar' ? product.name : (product.name_en || product.name);
        const desc = currentLang === 'ar' ? (product.description || '') : (product.description_en || product.description || '');

        card.innerHTML = `
            <div class="product-card-content">
                <div class="product-info">
                    <div>
                        <div class="product-title">${name}</div>
                        <div class="product-description">${desc}</div>
                    </div>
                    <div class="product-price-tag">
                        ${product.price} <small>${currentLang === 'ar' ? 'ج.م' : 'EGP'}</small>
                    </div>
                </div>
                <div class="product-image-container">
                    <img src="${product.image || '../assets/images/placeholder.png'}" alt="${name}">
                    <div class="product-image-overlay"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== Actions ====================

function switchCategory(id) {
    if (selectedCategoryId === id) return;
    selectedCategoryId = id;
    renderMenu();
}

function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    const cat = categories.find(c => c.id === product.category_id);

    document.getElementById('modalProductImage').src = product.image || '../assets/images/placeholder.png';
    document.getElementById('modalCategoryName').textContent = currentLang === 'ar' ? (cat?.name || '') : (cat?.name_en || cat?.name || '');
    document.getElementById('modalProductName').textContent = currentLang === 'ar' ? product.name : (product.name_en || product.name);
    document.getElementById('modalProductDesc').textContent = currentLang === 'ar' ? (product.description || '') : (product.description_en || product.description || '');
    document.getElementById('modalProductPrice').textContent = product.price;
    document.getElementById('currencyLabel').textContent = currentLang === 'ar' ? 'ج.م' : 'EGP';
    document.getElementById('orderBtn').textContent = currentLang === 'ar' ? 'إضافة للطلب' : 'Add to Order';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function () {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
};

function setupEventListeners() {
    // Language Toggle
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        updateThemeAndMeta();
        renderMenu();
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}
