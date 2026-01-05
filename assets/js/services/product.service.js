/**
 * ProductService - Manages menu items/products
 */
const ProductService = {
    async getProducts(restaurantId) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('products')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false }),
            'فشل في تحميل المنتجات'
        );
    },

    async saveProduct(productData, imageFile = null) {
        const { id, restaurant_id, ...data } = productData;

        // Handle Image Upload if needed
        if (imageFile) {
            const fileName = `${restaurant_id}/prod_${Date.now()}.${imageFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('restaurant-images')
                .upload(fileName, imageFile);

            if (uploadError) return ApiService.handleError(uploadError, 'فشل في رفع صورة المنتج');

            const { data: urlData } = window.supabaseClient.storage
                .from('restaurant-images').getPublicUrl(fileName);

            data.image = urlData.publicUrl;
        }

        if (id) {
            return await ApiService.fetch(
                window.supabaseClient.from('products').update(data).eq('id', id),
                'فشل في تحديث المنتج'
            );
        } else {
            return await ApiService.fetch(
                window.supabaseClient.from('products').insert({ ...data, restaurant_id }),
                'فشل في إضافة المنتج'
            );
        }
    },

    async deleteProduct(id) {
        return await ApiService.fetch(
            window.supabaseClient.from('products').delete().eq('id', id),
            'فشل في حذف المنتج'
        );
    }
};

window.ProductService = ProductService;
