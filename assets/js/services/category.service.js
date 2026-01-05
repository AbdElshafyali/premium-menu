/**
 * CategoryService - Manages menu categories
 */
const CategoryService = {
    async getCategories(restaurantId, activeOnly = false) {
        let query = window.supabaseClient
            .from('categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('display_order');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        return await ApiService.fetch(query, 'فشل في تحميل الأقسام');
    },

    async saveCategory(categoryData) {
        const { id, ...data } = categoryData;

        if (id) {
            return await ApiService.fetch(
                window.supabaseClient.from('categories').update(data).eq('id', id),
                'فشل في تحديث القسم'
            );
        } else {
            return await ApiService.fetch(
                window.supabaseClient.from('categories').insert(data),
                'فشل في إضافة القسم'
            );
        }
    },

    async deleteCategory(id) {
        return await ApiService.fetch(
            window.supabaseClient.from('categories').delete().eq('id', id),
            'فشل في حذف القسم'
        );
    }
};

window.CategoryService = CategoryService;
