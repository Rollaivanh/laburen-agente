import { createSupabaseClient } from './supabase-client.js';

function prioritizeByColor(products, maxProducts = 4) {
    if (!products || products.length === 0) {
        return [];
    }

    if (products.length <= maxProducts) {
        return products;
    }

    const productsByColor = {};
    products.forEach(product => {
        const color = (product.color || 'sin_color').toLowerCase();
        if (!productsByColor[color]) {
            productsByColor[color] = [];
        }
        productsByColor[color].push(product);
    });

    const result = [];
    const usedColors = new Set();

    for (const product of products) {
        if (result.length >= maxProducts) break;

        const color = (product.color || 'sin_color').toLowerCase();
        if (!usedColors.has(color)) {
            result.push(product);
            usedColors.add(color);
        }
    }

    if (result.length < maxProducts) {
        for (const product of products) {
            if (result.length >= maxProducts) break;
            if (!result.find(p => p.id === product.id)) {
                result.push(product);
            }
        }
    }

    return result.slice(0, maxProducts);
}

export const ProductService = {
    async list(env, filters = {}) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            let query = client.from('Product').select('*');

            if (filters.name) {
                query = query.ilike('name', `%${filters.name}%`);
            }

            if (filters.color) {
                query = query.ilike('color', `%${filters.color}%`);
            }

            if (filters.description) {
                query = query.ilike('description', `%${filters.description}%`);
            }

            const { data, error } = await query.order('id', { ascending: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    let query2 = client.from('"Product"').select('*');

                    if (filters.name) {
                        query2 = query2.ilike('name', `%${filters.name}%`);
                    }

                    if (filters.color) {
                        query2 = query2.eq('color', filters.color);
                    }

                    if (filters.description) {
                        query2 = query2.ilike('description', `%${filters.description}%`);
                    }

                    const { data: data2, error: error2 } = await query2.order('id', { ascending: true });
                    if (error2) {
                        throw error2;
                    }
                    return prioritizeByColor(data2, 4);
                }
                throw error;
            }

            return prioritizeByColor(data, 4);
        } catch (error) {
            console.error('Error al listar productos:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async listAvailable(env) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            let query = client.from('Product').select('name').gt('stock', 0);
            const { data, error } = await query.order('name', { ascending: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    let query2 = client.from('"Product"').select('name').gt('stock', 0);
                    const { data: data2, error: error2 } = await query2.order('name', { ascending: true });
                    if (error2) {
                        throw error2;
                    }
                    return data2;
                }
                throw error;
            }

            const uniqueNames = [...new Set(data.map(p => p.name))];
            return uniqueNames;

        } catch (error) {
            console.error('Error al listar productos disponibles:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async topProductsByStock(env) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            let query = client.from('Product').select('*').order('stock', { ascending: false }).limit(3);
            const { data, error } = await query;

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    let query2 = client.from('"Product"').select('*').order('stock', { ascending: false }).limit(3);
                    const { data: data2, error: error2 } = await query2;
                    if (error2) {
                        throw error2;
                    }
                    return data2;
                }
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Error al obtener top productos por stock:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async getByIds(env, productIds) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return [];
        }

        try {
            let query = client.from('Product').select('*').in('id', productIds);
            const { data, error } = await query;

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    let query2 = client.from('"Product"').select('*').in('id', productIds);
                    const { data: data2, error: error2 } = await query2;
                    if (error2) {
                        throw error2;
                    }
                    return data2 || [];
                }
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('Error al obtener productos por IDs:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },
};
