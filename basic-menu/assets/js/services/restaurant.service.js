/**
 * RestaurantService - Manages restaurant profile and settings
 */
const RestaurantService = {
    async getRestaurantByEmail(email) {
        // First, find which restaurant(s) this email is an admin for
        const { data: adminEntry, error: adminError } = await window.supabaseClient
            .from('restaurant_admins')
            .select('restaurant_id')
            .eq('email', email)
            .single();

        if (adminError || !adminEntry) {
            throw new Error('لم يتم العثور على مطاعم مرتبطة بهذا البريد');
        }

        return await this.getRestaurantById(adminEntry.restaurant_id);
    },

    async getAdmins(restaurantId) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurant_admins')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: true }),
            'فشل في تحميل قائمة المسؤولين'
        );
    },

    async addAdmin(restaurantId, email, role = 'editor') {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurant_admins')
                .insert([{ restaurant_id: restaurantId, email, role }]),
            'فشل في إضافة مسؤول جديد'
        );
    },

    async removeAdmin(adminId) {
        return await ApiService.fetch(
            window.supabaseClient
                .from('restaurant_admins')
                .delete()
                .eq('id', adminId),
            'فشل في حذف المسؤول'
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
