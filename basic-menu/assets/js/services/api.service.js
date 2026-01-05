/**
 * ApiService - Base service for interacting with Supabase
 */
const ApiService = {
    /**
     * Common error handler for Supabase responses
     */
    handleError(error, customMessage = 'حدث خطأ غير متوقع') {
        console.error('Supabase Error:', error);
        // You can integrate a toast notification system here
        return { error: error.message || customMessage, data: null };
    },

    /**
     * Generic fetch wrapper (Safe Select)
     */
    async fetch(promise, errorMessage) {
        try {
            const { data, error } = await promise;
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return this.handleError(error, errorMessage);
        }
    }
};

window.ApiService = ApiService;
