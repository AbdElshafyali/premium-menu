/**
 * Rich Cafe: Spatial Fluidity Logic (GSAP Optimized)
 */

// --- STATE ---
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('r');

let restaurant = null;
let CATEGORIES = [];
let ALL_PRODUCTS = [];
let currentLang = 'ar';
let currentCat = null;
let isTransitioning = false;

// --- DOM ELEMENTS ---
const menuGrid = document.getElementById('menuGrid');
const navSpine = document.getElementById('navSpine');
const langToggle = document.getElementById('langToggle');
const productModal = document.getElementById('productModal');

// --- INITIALIZATION ---
window.onload = async () => {
    if (!restaurantId) {
        document.body.innerHTML = '<div class="min-h-screen bg-[#0C0C0D] flex items-center justify-center"><h1>❌ رابط المنيو غير صالح</h1></div>';
        return;
    }

    await loadData();
    initUI();

    // Smooth entry animations
    if (window.gsap) {
        gsap.from('header', { y: -100, opacity: 0, duration: 1.2, ease: "expo.out" });
        gsap.from('#navSpine', { x: 100, opacity: 0, duration: 1.2, delay: 0.3, ease: "expo.out" });
    }
};

async function loadData() {
    try {
        const { data: resData } = await RestaurantService.getRestaurantById(restaurantId);
        if (!resData) return;
        restaurant = resData;
        currentLang = restaurant.default_language || 'ar';

        const [catsRes, prodsRes] = await Promise.all([
            CategoryService.getCategories(restaurantId, true),
            ProductService.getProducts(restaurantId)
        ]);

        if (catsRes.data) CATEGORIES = catsRes.data;
        if (prodsRes.data) ALL_PRODUCTS = prodsRes.data;

        if (CATEGORIES.length > 0) currentCat = CATEGORIES[0].id;
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

function initUI() {
    updateGlobalText();
    renderSpine();
    renderItems(true); // Initial render without delay
}

function updateGlobalText() {
    const isAr = currentLang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    document.getElementById('brandName').innerText = "RICH CAFE";
    document.getElementById('brandSub').innerText = isAr ? 'مساحة فنون الطهي التجريبية' : 'Experimental Culinary Space';
    document.getElementById('pageTitle').innerText = `RICH CAFE - Digital Experience`;
    langToggle.innerText = isAr ? 'English' : 'عربي';

    // Spine position adjustment
    if (navSpine) {
        navSpine.style.right = isAr ? '0' : 'auto';
        navSpine.style.left = isAr ? 'auto' : '0';
        navSpine.classList.toggle('items-end', isAr);
        navSpine.classList.toggle('items-start', !isAr);
    }
}

// --- RENDERING & ANIMATION ---

function renderSpine() {
    if (!navSpine) return;
    navSpine.innerHTML = CATEGORIES.map(cat => {
        const name = currentLang === 'ar' ? cat.name : (cat.name_en || cat.name);
        return `
            <div class="spine-item ${cat.id === currentCat ? 'active' : ''}" data-id="${cat.id}">
                <span class="spine-label ${currentLang === 'ar' ? 'ml-4' : 'mr-4'}">${name}</span>
                <div class="spine-dot"></div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.spine-item').forEach(item => {
        item.addEventListener('click', () => switchCategory(item.dataset.id));
    });
}

function switchCategory(catId) {
    if (currentCat === catId || isTransitioning) return;
    isTransitioning = true;

    const prevCat = currentCat;
    currentCat = catId;

    // 1. Spine Update
    document.querySelectorAll('.spine-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === catId);
    });

    if (!window.gsap) {
        renderItems(true);
        isTransitioning = false;
        return;
    }

    // 2. Scene Transition
    const tl = gsap.timeline({
        onComplete: () => { isTransitioning = false; }
    });

    tl.to('#menuGrid, #categoryHeader', {
        opacity: 0,
        y: prevCat > catId ? 30 : -30,
        duration: 0.3,
        ease: "power2.inOut"
    });

    tl.add(() => {
        renderItems();
    });

    tl.fromTo('#menuGrid, #categoryHeader',
        { opacity: 0, y: prevCat > catId ? -30 : 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }
    );
}

function renderItems(immediate = false) {
    const catData = CATEGORIES.find(c => c.id === currentCat);
    if (!catData) return;

    const catName = currentLang === 'ar' ? catData.name : (catData.name_en || catData.name);
    document.getElementById('activeCatTitle').innerText = catName;
    document.getElementById('activeCatIcon').innerText = catData.icon || '📂';
    document.getElementById('bgCategoryTitle').innerText = catName.toUpperCase();

    const items = ALL_PRODUCTS.filter(i => i.category_id === currentCat);

    if (items.length === 0) {
        menuGrid.innerHTML = `
            <div class="py-24 text-center opacity-40 uppercase tracking-[0.5em] text-xs font-black">
                ${currentLang === 'ar' ? 'رحلة قادمة قريباً' : 'Journey Coming Soon'}
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = items.map((item, idx) => {
        const name = currentLang === 'ar' ? item.name : (item.name_en || item.name);
        const desc = currentLang === 'ar' ? (item.description || '') : (item.description_en || item.description || '');
        const currency = currentLang === 'ar' ? 'ر.س' : 'SAR';

        const sideClass = idx % 2 === 0 ? 'translate-x-2' : '-translate-x-2';

        return `
            <div class="product-card ${sideClass} opacity-0" 
                 onclick="openProductDetails('${item.id}')">
                <div class="card-content">
                    <div class="product-info">
                        <h4 class="text-xl font-black leading-tight mb-2 uppercase tracking-tighter">${name}</h4>
                        <p class="text-white/20 text-[9px] line-clamp-2 font-medium max-w-[90%]">${desc}</p>
                        <div class="text-xl font-black text-[#D4AF37] mt-3">
                            ${item.price} 
                            <span class="text-[8px] opacity-40 uppercase tracking-widest">${currency}</span>
                        </div>
                    </div>
                    <div class="product-img-container">
                        <img src="${item.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1000'}" 
                             class="product-img h-full w-full object-cover" alt="${name}">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.gsap && !immediate) {
        gsap.to('.product-card', {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });
    } else {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
    }
}

// --- UI INTERACTION ---

window.openProductDetails = function (id) {
    const item = ALL_PRODUCTS.find(i => i.id === id);
    if (!item) return;

    const cat = CATEGORIES.find(c => c.id === item.category_id);
    const currency = currentLang === 'ar' ? 'ر.س' : 'SAR';

    document.getElementById('modalImg').src = item.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1000';
    document.getElementById('modalTitle').innerText = currentLang === 'ar' ? item.name : (item.name_en || item.name);
    document.getElementById('modalCat').innerText = currentLang === 'ar' ? (cat?.name || '') : (cat?.name_en || cat?.name || '');
    document.getElementById('modalDesc').innerText = currentLang === 'ar' ? (item.description || '') : (item.description_en || item.description || '');
    document.getElementById('modalPrice').innerText = item.price;
    document.getElementById('currencyLabel').innerText = currency;
    document.getElementById('orderBtn').innerText = currentLang === 'ar' ? 'إضافة للطلب' : 'Add to Order';

    productModal.classList.remove('hidden-state');
    document.body.style.overflow = 'hidden';

    if (window.gsap) {
        gsap.from('#modalHero img', { scale: 1.3, duration: 1.5, ease: "expo.out" });
        gsap.from('.animate-content > *', { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, ease: "power2.out", delay: 0.2 });
    }
};

window.closeModal = function () {
    productModal.classList.add('hidden-state');
    document.body.style.overflow = '';
};

langToggle.addEventListener('click', () => {
    if (window.gsap) {
        gsap.to('#mobileOverlay', {
            opacity: 1,
            duration: 0.3,
            onComplete: () => {
                currentLang = currentLang === 'ar' ? 'en' : 'ar';
                updateGlobalText();
                renderSpine();
                renderItems(true);
                gsap.to('#mobileOverlay', { opacity: 0, duration: 0.5, delay: 0.1 });
            }
        });
    } else {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        updateGlobalText();
        renderSpine();
        renderItems(true);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
