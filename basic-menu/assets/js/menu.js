/**
 * Premium Digital Menu Logic (Dynamic Integrated Version)
 */

// --- STATE ---
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('r');

let restaurant = null;
let CATEGORIES = [];
let ALL_PRODUCTS = [];
let currentLang = 'ar';
let currentCat = null;

// --- DOM ELEMENTS ---
const menuGrid = document.getElementById('menuGrid');
const navWrapper = document.getElementById('navWrapper');
const langToggle = document.getElementById('langToggle');
const productModal = document.getElementById('productModal');

// --- INITIALIZATION ---
window.onload = async () => {
    if (!restaurantId) {
        document.body.innerHTML = '<div class="min-h-screen bg-black flex items-center justify-center"><h1>❌ رابط المنيو غير صالح</h1></div>';
        return;
    }

    await loadData();
    initUI();
};

async function loadData() {
    // 1. Fetch Restaurant Settings
    const { data: resData } = await RestaurantService.getRestaurantById(restaurantId);
    if (!resData) return;
    restaurant = resData;
    currentLang = restaurant.default_language || 'ar';

    // 2. Fetch Categories & Products
    const [catsRes, prodsRes] = await Promise.all([
        CategoryService.getCategories(restaurantId, true),
        ProductService.getProducts(restaurantId)
    ]);

    if (catsRes.data) CATEGORIES = catsRes.data;
    if (prodsRes.data) ALL_PRODUCTS = prodsRes.data;

    // Set initial category
    if (CATEGORIES.length > 0) {
        currentCat = CATEGORIES[0].id;
    }
}

function initUI() {
    updateGlobalText();
    renderNav();
    renderItems();
    setupNavInteraction();
}

function updateGlobalText() {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    document.getElementById('brandName').innerText = restaurant.name;
    document.getElementById('brandSub').innerText = currentLang === 'ar' ? 'بيتزا وقهوة مختصة' : 'Pizza & Specialty Coffee';
    document.getElementById('pageTitle').innerText = `${restaurant.name} - Digital Menu`;
    langToggle.innerText = currentLang === 'ar' ? 'English' : 'عربي';
}

// --- RENDERING ---

function renderNav() {
    navWrapper.innerHTML = CATEGORIES.map(cat => {
        const name = currentLang === 'ar' ? cat.name : (cat.name_en || cat.name);
        return `
            <div class="nav-item ${cat.id === currentCat ? 'active' : ''}" data-id="${cat.id}">
                <span class="label">${name}</span>
                <div class="icon-box">${cat.icon || '📂'}</div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchCategory(item.dataset.id));
    });
}

function switchCategory(catId) {
    if (currentCat === catId) return;
    currentCat = catId;

    // Smooth transition
    renderNav();
    renderItems();

    // Scroll selected item into view
    const activeItem = document.querySelector(`.nav-item[data-id="${catId}"]`);
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function renderItems() {
    const catData = CATEGORIES.find(c => c.id === currentCat);
    if (!catData) return;

    const catName = currentLang === 'ar' ? catData.name : (catData.name_en || catData.name);
    document.getElementById('activeCatTitle').innerText = catName;
    document.getElementById('activeCatIcon').innerText = catData.icon || '📂';
    document.getElementById('bgCategoryTitle').innerText = catName.toUpperCase();

    const items = ALL_PRODUCTS.filter(i => i.category_id === currentCat);

    if (items.length === 0) {
        menuGrid.innerHTML = `
            <div class="py-24 text-center opacity-40 uppercase tracking-widest text-sm">
                ${currentLang === 'ar' ? 'قريباً في القائمة' : 'Coming Soon'}
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = items.map((item, idx) => {
        const name = currentLang === 'ar' ? item.name : (item.name_en || item.name);
        const desc = currentLang === 'ar' ? (item.description || '') : (item.description_en || item.description || '');
        const currency = currentLang === 'ar' ? 'ج.م' : 'EGP';

        return `
            <div class="product-card h-40 rounded-[2rem] overflow-hidden bg-[#161616] border border-white/5 active:scale-[0.97] transition-all cursor-pointer shadow-2xl relative" 
                 onclick="openProductDetails('${item.id}')">
                <div class="absolute inset-0 flex ${currentLang === 'ar' ? 'flex-row-reverse' : 'flex-row'}">
                    <div class="flex-1 p-6 flex flex-col justify-between z-10 relative">
                        <div>
                            <h4 class="text-lg font-black leading-tight">${name}</h4>
                            <p class="text-white/30 text-[10px] line-clamp-2 mt-1 font-medium leading-relaxed">${desc}</p>
                        </div>
                        <div class="text-xl font-black text-[#EAB308]">
                            ${item.price} 
                            <span class="text-[10px] opacity-40 uppercase">${currency}</span>
                        </div>
                    </div>
                    <div class="w-[45%] relative">
                        <img src="${item.image || '../assets/images/placeholder.png'}" class="w-full h-full object-cover grayscale-[0.2]" alt="${name}">
                        <div class="absolute inset-0 ${currentLang === 'ar' ? 'card-mask-rtl' : 'card-mask-ltr'}"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupNavInteraction() {
    let isScrolling;
    navWrapper.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            const wrapperRect = navWrapper.getBoundingClientRect();
            const centerX = wrapperRect.left + wrapperRect.width / 2;
            let closestId = currentCat;
            let minDistance = Infinity;

            document.querySelectorAll('.nav-item').forEach(item => {
                const rect = item.getBoundingClientRect();
                const distance = Math.abs(centerX - (rect.left + rect.width / 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestId = item.dataset.id;
                }
            });

            if (closestId && closestId !== currentCat) {
                switchCategory(closestId);
            }
        }, 150);
    });
}

// --- UI INTERACTION ---

window.openProductDetails = function (id) {
    const item = ALL_PRODUCTS.find(i => i.id === id);
    if (!item) return;

    const cat = CATEGORIES.find(c => c.id === item.category_id);
    const currency = currentLang === 'ar' ? 'ج.م' : 'EGP';

    document.getElementById('modalImg').src = item.image || '../assets/images/placeholder.png';
    document.getElementById('modalTitle').innerText = currentLang === 'ar' ? item.name : (item.name_en || item.name);
    document.getElementById('modalCat').innerText = currentLang === 'ar' ? (cat?.name || '') : (cat?.name_en || cat?.name || '');
    document.getElementById('modalDesc').innerText = currentLang === 'ar' ? (item.description || '') : (item.description_en || item.description || '');
    document.getElementById('modalPrice').innerText = item.price;
    document.getElementById('currencyLabel').innerText = currency;
    document.getElementById('orderBtn').innerText = currentLang === 'ar' ? 'إضافة للطلب' : 'Add to Order';

    productModal.classList.remove('hidden-state');
    document.body.style.overflow = 'hidden';
};

window.closeModal = function () {
    productModal.classList.add('hidden-state');
    document.body.style.overflow = '';
};

langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    updateGlobalText();
    renderNav();
    renderItems();
});

// Close modal on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
