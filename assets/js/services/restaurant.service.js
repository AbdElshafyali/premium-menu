/**
 * RestaurantService - Manages restaurant profile and settings
 */
const RestaurantService = {
    async getRestaurantByEmail(email) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurants')
                .select('*')
                .eq('admin_email', email)
                .single(),
            'فشل في تحميل بيانات المطعم'
        );
    },

    async getRestaurantById(id) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurants')
                .select('*')
                .eq('id', id)
                .single(),
            'فشل في تحميل بيانات المطعم'
        );
    },

    async updateRestaurant(id, data) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurants')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id),
            'فشل في تحديث بيانات المطعم'
        );
    },

    async uploadLogo(restaurantId, file) {
        const fileName = `${restaurantId}/logo_${Date.now()}.${file.name.split('.').pop()}`;
        const { data, error } = await window.supabaseClient.storage
            .from('restaurant-images')
            .upload(fileName, file);

        if (error) return ApiService.handleError(error, 'فشل في رفع الشعار');

        const { data: urlData } = window.supabaseClient.storage
            .from('restaurant-images')
            .getPublicUrl(fileName);

        return await this.updateRestaurant(restaurantId, { logo: urlData.publicUrl });
    }
};

window.RestaurantService = RestaurantService;
