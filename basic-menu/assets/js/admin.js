/**
 * Admin Logic - Rewritten to use Services
 */

// Global Variables
let currentRestaurant = null;
let categories = [];
let products = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await initializeData();
    setupEventListeners();
});

let currentUserRole = 'editor';

// ==================== Authentication ====================
async function checkAuth() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});

// ==================== Data Initialization ====================
async function initializeData() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    // Load Restaurant
    try {
        const restaurant = await RestaurantService.getRestaurantByEmail(user.email);
        if (restaurant) {
            currentRestaurant = restaurant;

            // Get current user's role from the admins table
            const { data: admins } = await RestaurantService.getAdmins(currentRestaurant.id);
            const currentAdmin = admins.find(a => a.email === user.email);
            currentUserRole = currentAdmin ? currentAdmin.role : 'editor';

            updateRestaurantUI();

            // Load Details
            await Promise.all([
                loadCategories(),
                loadProducts(),
                currentUserRole === 'owner' ? loadAdmins() : Promise.resolve()
            ]);
        }
    } catch (error) {
        console.error('Restaurant not found or error loading data:', error);
    }
}

function updateRestaurantUI() {
    if (!currentRestaurant) return;

    document.getElementById('restaurantName').textContent = currentRestaurant.name;
    document.getElementById('nameAr').value = currentRestaurant.name;
    document.getElementById('nameEn').value = currentRestaurant.name_en || '';

    if (currentRestaurant.logo) {
        document.getElementById('logoPreview').src = currentRestaurant.logo;
        document.getElementById('headerLogo').src = currentRestaurant.logo;
    }

    const menuUrl = `${window.location.origin}/menu/?r=${currentRestaurant.id}`;
    document.getElementById('menuUrl').value = menuUrl;
    generateQRCode(menuUrl);

    // Show/Hide Administrative Sections
    const adminSection = document.getElementById('adminManagementSection');
    if (adminSection) {
        adminSection.style.display = currentUserRole === 'owner' ? 'block' : 'none';
    }
}

// ==================== Categories ====================
async function loadCategories() {
    const { data, error } = await CategoryService.getCategories(currentRestaurant.id);
    if (!error) {
        categories = data;
        renderCategories();
        updateCategoryFilter();
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';

    if (categories.length === 0) {
        container.innerHTML = '<p>لا توجد أقسام بعد. اضغط "إضافة قسم" لإنشاء قسم جديد.</p>';
        return;
    }

    categories.forEach(category => {
        const productCount = products.filter(p => p.category_id === category.id).length;
        const card = `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <div class="item-title">${category.icon || '📂'} ${category.name}</div>
                        <small>${category.name_en || ''}</small>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary" onclick="editCategory('${category.id}')">✏️</button>
                        <button class="btn btn-danger" onclick="deleteCategory('${category.id}')">🗑️</button>
                    </div>
                </div>
                <div>عدد المنتجات: ${productCount}</div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// ==================== Products ====================
async function loadProducts() {
    const { data, error } = await ProductService.getProducts(currentRestaurant.id);
    if (!error) {
        products = data;
        renderProducts();
    }
}

function renderProducts(filter = '') {
    const container = document.getElementById('productsList');
    container.innerHTML = '';

    let filteredProducts = products;

    // Filter by category
    const categoryFilter = document.getElementById('categoryFilter').value;
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(p => p.category_id === categoryFilter);
    }

    // Search filter
    if (filter) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.includes(filter) ||
            (p.name_en && p.name_en.toLowerCase().includes(filter.toLowerCase()))
        );
    }

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p>لا توجد منتجات.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = `
            <div class="item-card product-card">
                <img src="${product.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1000'}" alt="${product.name}">
                <div class="item-header">
                    <div>
                        <div class="item-title">${product.name}</div>
                        <small>${product.name_en || ''}</small>
                    </div>
                    <span class="badge ${product.is_available ? 'badge-success' : 'badge-danger'}">
                        ${product.is_available ? 'متوفر' : 'غير متوفر'}
                    </span>
                </div>
                <div class="product-price">${product.price} ج.م</div>
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="editProduct('${product.id}')">✏️ تعديل</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">🗑️ حذف</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// ==================== User Management ====================
async function loadAdmins() {
    const { data, error } = await RestaurantService.getAdmins(currentRestaurant.id);
    if (!error) {
        renderAdmins(data);
    }
}

function renderAdmins(admins) {
    const container = document.getElementById('adminsList');
    if (!container) return;

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>البريد الإلكتروني</th>
                    <th>الصلاحية</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${admins.map(admin => `
                    <tr>
                        <td>${admin.email}</td>
                        <td><span class="badge ${admin.role === 'owner' ? 'badge-primary' : 'badge-secondary'}">${admin.role === 'owner' ? 'مالك' : 'محرر'}</span></td>
                        <td>${new Date(admin.created_at).toLocaleDateString('ar-EG')}</td>
                        <td>
                            ${admin.role !== 'owner' ? `<button class="btn btn-danger btn-sm" onclick="deleteAdmin('${admin.id}')">🗑️ حذف</button>` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.showAddAdminModal = function () {
    const body = `
        <form id="adminModalForm">
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="adminEmail" required placeholder="example@gmail.com">
            </div>
            <div class="form-group">
                <label>الصلاحية</label>
                <select id="adminRole">
                    <option value="editor">محرر (تعديل الأقسام والمنتجات)</option>
                    <option value="manager">مدير (نفس صلاحيات المحرر)</option>
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeActiveModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="handleAdminAdd()">➕ إضافة</button>
    `;

    showModal('👥 إضافة مسؤول جديد', body, footer);
}

window.handleAdminAdd = async function () {
    const email = document.getElementById('adminEmail').value;
    const role = document.getElementById('adminRole').value;

    if (!email) {
        alert('يرجى إدخال البريد الإلكتروني');
        return;
    }

    const { error } = await RestaurantService.addAdmin(currentRestaurant.id, email, role);
    if (!error) {
        closeActiveModal();
        loadAdmins();
    }
}

window.deleteAdmin = async function (id) {
    if (confirm('هل أنت متأكد من حذف هذا المسؤول؟ لن يتمكن من الوصول للوحة التحكم مرة أخرى.')) {
        const { error } = await RestaurantService.removeAdmin(id);
        if (!error) loadAdmins();
    }
}

// ==================== Forms & Listeners ====================
function setupEventListeners() {
    // Restaurant Settings
    document.getElementById('restaurantForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('nameAr').value,
            name_en: document.getElementById('nameEn').value
        };
        const { error } = await RestaurantService.updateRestaurant(currentRestaurant.id, data);
        if (!error) {
            alert('✅ تم حفظ الإعدادات بنجاح');
            initializeData();
        }
    });

    // Logo Upload
    document.getElementById('logoInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const { error } = await RestaurantService.uploadLogo(currentRestaurant.id, file);
        if (!error) {
            alert('✅ تم رفع الشعار بنجاح');
            initializeData();
        }
    });

    // Search & Filter
    document.getElementById('categoryFilter')?.addEventListener('change', () => renderProducts());
    document.getElementById('searchProducts')?.addEventListener('input', (e) => renderProducts(e.target.value));

    // Add Buttons
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => showCategoryModal());
    document.getElementById('addProductBtn')?.addEventListener('click', () => showProductModal());
    document.getElementById('addAdminBtn')?.addEventListener('click', () => showAddAdminModal());

    // Share Actions
    document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
        const url = document.getElementById('menuUrl').value;
        navigator.clipboard.writeText(url);
        alert('✅ تم نسخ الرابط');
    });

    document.getElementById('downloadQR')?.addEventListener('click', () => {
        const canvas = document.querySelector('#qrCodeContainer canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'menu-qr-code.png';
            link.href = url;
            link.click();
        }
    });
}

// ==================== Modals Management ====================
function showModal(title, bodyHtml, footerHtml) {
    const modalHtml = `
        <div class="modal-overlay" id="activeModalOverlay">
            <div class="modal shadow-lg">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeActiveModal()">✕</button>
                </div>
                <div class="modal-body">${bodyHtml}</div>
                <div class="modal-footer">${footerHtml}</div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modalHtml;
}

window.closeActiveModal = function () {
    document.getElementById('modalContainer').innerHTML = '';
};

// ==================== Category Modals ====================
window.showCategoryModal = function (category = null) {
    const isEdit = !!category;
    const body = `
        <form id="categoryModalForm">
            <div class="form-group">
                <label>اسم القسم (عربي)</label>
                <input type="text" id="catNameAr" value="${category?.name || ''}" required>
            </div>
            <div class="form-group">
                <label>اسم القسم (إنجليزي)</label>
                <input type="text" id="catNameEn" value="${category?.name_en || ''}">
            </div>
            <div class="form-group">
                <label>أيقونة (Emoji)</label>
                <input type="text" id="catIcon" value="${category?.icon || '📂'}">
            </div>
            <div class="form-group">
                <label>ترتيب العرض</label>
                <input type="number" id="catOrder" value="${category?.display_order || 0}">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeActiveModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="handleCategorySave(${category ? `'${category.id}'` : 'null'})">
            ${isEdit ? '💾 حفظ التعديلات' : '➕ إضافة القسم'}
        </button>
    `;

    showModal(isEdit ? '✏️ تعديل قسم' : '📂 إضافة قسم جديد', body, footer);
};

window.handleCategorySave = async function (id) {
    const data = {
        id,
        name: document.getElementById('catNameAr').value,
        name_en: document.getElementById('catNameEn').value,
        icon: document.getElementById('catIcon').value,
        display_order: parseInt(document.getElementById('catOrder').value),
        restaurant_id: currentRestaurant.id
    };

    const { error } = await CategoryService.saveCategory(data);
    if (!error) {
        closeActiveModal();
        loadCategories();
    }
};

window.editCategory = async function (id) {
    const category = categories.find(c => c.id === id);
    if (category) showCategoryModal(category);
};

window.deleteCategory = async function (id) {
    if (confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع المنتجات الموجودة في هذا القسم أيضاً!')) {
        const { error } = await CategoryService.deleteCategory(id);
        if (!error) loadCategories();
    }
};

// ==================== Product Modals ====================
window.showProductModal = function (product = null) {
    const isEdit = !!product;
    const body = `
        <form id="productModalForm">
            <div class="form-group">
                <label>🖼️ صورة المنتج</label>
                <div class="image-upload">
                    <img src="${product?.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1000'}" id="modalProductPreview">
                    <input type="file" id="modalProductInput" accept="image/*" style="display:none" onchange="previewProductImage(this)">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalProductInput').click()">📤 تغيير الصورة</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>اسم المنتج (عربي)</label>
                    <input type="text" id="prodNameAr" value="${product?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>اسم المنتج (إنجليزي)</label>
                    <input type="text" id="prodNameEn" value="${product?.name_en || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>السعر</label>
                <input type="number" step="0.01" id="prodPrice" value="${product?.price || ''}" required>
            </div>
            <div class="form-group">
                <label>القسم</label>
                <select id="prodCategory">
                    ${categories.map(c => `<option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>الوصف (عربي)</label>
                <textarea id="prodDescAr">${product?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="prodAvailable" ${product?.is_available !== false ? 'checked' : ''}> متوفر في المنيو
                </label>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeActiveModal()">إلغاء</button>
        <button class="btn btn-primary" id="saveProductBtn" onclick="handleProductSave(${product ? `'${product.id}'` : 'null'})">
            ${isEdit ? '💾 حفظ التعديلات' : '🍽️ إضافة المنتج'}
        </button>
    `;

    showModal(isEdit ? '✏️ تعديل منتج' : '🍽️ إضافة منتج جديد', body, footer);
};

window.previewProductImage = function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('modalProductPreview').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
};

window.handleProductSave = async function (id) {
    const saveBtn = document.getElementById('saveProductBtn');
    saveBtn.disabled = true;

    const imageFile = document.getElementById('modalProductInput').files[0];
    const productData = {
        id,
        restaurant_id: currentRestaurant.id,
        name: document.getElementById('prodNameAr').value,
        name_en: document.getElementById('prodNameEn').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        category_id: document.getElementById('prodCategory').value,
        description: document.getElementById('prodDescAr').value,
        is_available: document.getElementById('prodAvailable').checked
    };

    const { error } = await ProductService.saveProduct(productData, imageFile);
    if (!error) {
        closeActiveModal();
        loadProducts();
    } else {
        saveBtn.disabled = false;
    }
};

window.editProduct = function (id) {
    const product = products.find(p => p.id === id);
    if (product) showProductModal(product);
};

window.deleteProduct = async function (id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        const { error } = await ProductService.deleteProduct(id);
        if (!error) loadProducts();
    }
};

// ==================== Utilities ====================
function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    select.innerHTML = '<option value="">كل الأقسام</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

function generateQRCode(url) {
    const container = document.getElementById('qrCodeContainer');
    if (!container) return;
    container.innerHTML = '';
    new QRCode(container, { text: url, width: 200, height: 200 });
}
