/**
 * Servicio de Producto para Supabase
 */

import { createSupabaseClient } from './supabase-client.js';

/**
 * Funciones para la entidad Product
 */
export const ProductService = {
    /**
     * Lista productos con filtros opcionales
     * @param {Object} env - Variables de entorno
     * @param {Object} filters - Filtros opcionales: { name, color, description }
     */
    async list(env, filters = {}) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null; // Supabase no configurado
        }

        try {
            // Intentar con 'Product' primero, si falla probar con '"Product"' (con comillas)
            let query = client.from('Product').select('*');

            // Aplicar filtros
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
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    // Intentar con el nombre entre comillas
                    let query2 = client.from('"Product"').select('*');

                    // Aplicar los mismos filtros
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
                    return data2;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error al listar productos desde Supabase:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    /**
     * Lista productos disponibles con stock > 0
     */
    async listAvailable(env) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null; // Supabase no configurado
        }

        try {
            // Intentar con 'Product' primero, si falla probar con '"Product"' (con comillas)
            let query = client.from('Product').select('name').gt('stock', 0);

            const { data, error } = await query.order('name', { ascending: true });

            if (error) {
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    // Intentar con el nombre entre comillas
                    let query2 = client.from('"Product"').select('name').gt('stock', 0);
                    const { data: data2, error: error2 } = await query2.order('name', { ascending: true });
                    if (error2) {
                        throw error2;
                    }
                    return data2;
                }
                throw error;
            }

            // Obtener nombres únicos (DISTINCT)
            const uniqueNames = [...new Set(data.map(p => p.name))];
            return uniqueNames;

        } catch (error) {
            console.error('Error al listar productos disponibles desde Supabase:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    /**
     * Obtiene el top 3 productos con más stock
     */
    async topProductsByStock(env) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null; // Supabase no configurado
        }

        try {
            // Intentar con 'Product' primero, si falla probar con '"Product"' (con comillas)
            let query = client.from('Product').select('*').order('stock', { ascending: false }).limit(3);

            const { data, error } = await query;

            if (error) {
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    // Intentar con el nombre entre comillas
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
            console.error('Error al obtener top productos por stock desde Supabase:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },
};
