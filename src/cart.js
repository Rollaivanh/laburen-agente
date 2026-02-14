/**
 * Servicio de Carrito para Supabase
 */

import { createSupabaseClient } from './supabase-client.js';

/**
 * Genera un ID único para el carrito
 */
function generateCartId() {
    return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Genera un ID único para la conversación
 */
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Verifica si existe una conversación y la crea si no existe
 */
async function ensureConversation(client, conversationId) {
    try {
        // Buscar conversación existente
        let query = client.from('Conversation').select('*').eq('conversationId', conversationId).limit(1);

        const { data: existingConv, error: checkError } = await query;

        if (checkError) {
            // Si el error es sobre la tabla no encontrada, intentar con comillas
            if (checkError.code === 'PGRST116' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
                query = client.from('"Conversation"').select('*').eq('conversationId', conversationId).limit(1);
                const { data: existingConv2, error: checkError2 } = await query;
                if (checkError2) {
                    throw checkError2;
                }
                if (existingConv2 && existingConv2.length > 0) {
                    return existingConv2[0];
                }
            } else {
                throw checkError;
            }
        }

        // Si existe, devolverla
        if (existingConv && existingConv.length > 0) {
            return existingConv[0];
        }

        // Si no existe, crearla
        const newConversation = {
            id: generateConversationId(),
            conversationId: conversationId,
            state: 'IDLE',
            updatedAt: new Date().toISOString(),
        };

        let insertQuery = client.from('Conversation').insert(newConversation).select();

        const { data: createdConv, error: insertError } = await insertQuery;

        if (insertError) {
            // Si el error es sobre la tabla no encontrada, intentar con comillas
            if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
                insertQuery = client.from('"Conversation"').insert(newConversation).select();
                const { data: createdConv2, error: insertError2 } = await insertQuery;
                if (insertError2) {
                    throw insertError2;
                }
                return createdConv2[0];
            }
            throw insertError;
        }

        return createdConv[0];

    } catch (error) {
        console.error('Error al verificar/crear conversación:', error);
        throw error;
    }
}

/**
 * Funciones para la entidad Cart
 */
export const CartService = {
    /**
     * Busca un carrito existente para un conversation_id
     * Si no existe, devuelve null (no crea nada)
     */
    async getCart(env, conversationId) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null; // Supabase no configurado
        }

        try {
            // Primero buscar la conversación para obtener su id
            const conversation = await ensureConversation(client, conversationId);
            const conversationDbId = conversation.id; // Usar el id de la BD

            // Buscar carrito existente y activo usando el id de la conversación
            let query = client.from('Cart').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);

            const { data, error } = await query;

            if (error) {
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    query = client.from('"Cart"').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);
                    const { data: data2, error: error2 } = await query;
                    if (error2) {
                        throw error2;
                    }
                    return data2 && data2.length > 0 ? data2[0] : null;
                }
                throw error;
            }

            // Si existe, devolverlo; si no, devolver null
            return data && data.length > 0 ? data[0] : null;

        } catch (error) {
            console.error('Error al buscar carrito desde Supabase:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    /**
     * Crea un carrito para un conversation_id
     * Si ya existe un carrito para ese conversation_id, lo devuelve
     * Si la conversación no existe, la crea primero
     */
    async createCart(env, conversationId) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null; // Supabase no configurado
        }

        try {
            // 1. Verificar/crear la conversación primero y obtener su id
            const conversation = await ensureConversation(client, conversationId);
            const conversationDbId = conversation.id; // Usar el id de la BD, no el conversationId

            // 2. Verificar si ya existe un carrito activo para este conversationId
            let query = client.from('Cart').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);

            const { data: existingCart, error: checkError } = await query;

            if (checkError) {
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (checkError.code === 'PGRST116' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
                    query = client.from('"Cart"').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);
                    const { data: existingCart2, error: checkError2 } = await query;
                    if (checkError2) {
                        throw checkError2;
                    }
                    if (existingCart2 && existingCart2.length > 0) {
                        return existingCart2[0];
                    }
                } else {
                    throw checkError;
                }
            }

            // Si ya existe un carrito activo, devolverlo
            if (existingCart && existingCart.length > 0) {
                return existingCart[0];
            }

            // 3. Crear nuevo carrito activo usando el id de la conversación
            const newCart = {
                id: generateCartId(),
                conversationId: conversationDbId, // Usar el id de la BD de Conversation, no el conversationId
                active: true,
                updatedAt: new Date().toISOString(),
            };

            let insertQuery = client.from('Cart').insert(newCart).select();

            const { data: createdCart, error: insertError } = await insertQuery;

            if (insertError) {
                // Si el error es sobre la tabla no encontrada, intentar con comillas
                if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
                    insertQuery = client.from('"Cart"').insert(newCart).select();
                    const { data: createdCart2, error: insertError2 } = await insertQuery;
                    if (insertError2) {
                        throw insertError2;
                    }
                    return createdCart2[0];
                }
                throw insertError;
            }

            return createdCart[0];

        } catch (error) {
            console.error('Error al crear carrito desde Supabase:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },
};
