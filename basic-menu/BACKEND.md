# توثيق الباك اند (Supabase)

## بنية قاعدة البيانات (Schema)

المشروع يعتمد على 3 جداول أساسية في Supabase:

### 1. `restaurants`
يخزن بيانات المطاعم المسجلة.
- `id` (uuid, primary key)
- `name` (text, arabic name)
- `name_en` (text, english name)
- `logo` (text, public url)
- `admin_email` (text, unique)
- `working_hours` (jsonb)

### 2. `categories`
يخزن أقسام المنيو.
- `id` (uuid, primary key)
- `restaurant_id` (foreign key to restaurants)
- `name` (text)
- `name_en` (text)
- `icon` (text, emoji/icon)
- `display_order` (int)
- `is_active` (boolean)

### 3. `products`
يخزن المنتجات داخل الأقسام.
- `id` (uuid, primary key)
- `category_id` (foreign key to categories)
- `restaurant_id` (foreign key to restaurants)
- `name`, `name_en` (text)
- `description`, `description_en` (text)
- `price` (numeric)
- `image` (text, public url)
- `is_available` (boolean)

---

## طبقة الخدمات (Services)

تم تنظيم الكود في `assets/js/services/` لتسهيل التعامل مع البيانات:

1. **`ApiService`**: يدير التعامل الأساسي مع أخطاء Supabase.
2. **`RestaurantService`**: مسؤول عن جلب بيانات المطعم ورفع اللوجو.
3. **`CategoryService`**: يدير عمليات إضافة/تعديل/حذف الأقسام.
4. **`ProductService`**: يدير عمليات المنتجات ورفع الصور الخاصة بها.

---

## سياسات الأمان (Row Level Security)

تم تفعيل الـ RLS لضمان الأمان:
- **SELECT**: متاح للجميع (Public) لمشاهدة المنيو.
- **ALL**: متاح فقط للأدمن المسجل دخول بنفس الإيميل المربوط بالمطعم.

---

## تخزين الصور (Storage)
يُستخدم Bucket باسم `restaurant-images` لتخزين اللوجوهات وصور المنتجات.
يتم تنظيم الصور داخل مجلدات باسم الـ `restaurant_id`.
