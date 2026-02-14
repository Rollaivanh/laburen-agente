import { createSupabaseClient } from './supabase-client.js';
import { ProductService } from './product.js';

function generateCartId() {
    return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function ensureConversation(client, conversationId) {
    try {
        let query = client.from('Conversation').select('*').eq('conversationId', conversationId).limit(1);
        const { data: existingConv, error: checkError } = await query;

        if (checkError) {
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

        if (existingConv && existingConv.length > 0) {
            return existingConv[0];
        }

        const newConversation = {
            id: generateConversationId(),
            conversationId: conversationId,
            state: 'IDLE',
            updatedAt: new Date().toISOString(),
        };

        let insertQuery = client.from('Conversation').insert(newConversation).select();
        const { data: createdConv, error: insertError } = await insertQuery;

        if (insertError) {
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

export const CartService = {
    async getCart(env, conversationId) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            const conversation = await ensureConversation(client, conversationId);
            const conversationDbId = conversation.id;

            let query = client.from('Cart').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);
            const { data, error } = await query;

            if (error) {
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

            return data && data.length > 0 ? data[0] : null;

        } catch (error) {
            console.error('Error al buscar carrito:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async createCart(env, conversationId) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            const conversation = await ensureConversation(client, conversationId);
            const conversationDbId = conversation.id;

            let query = client.from('Cart').select('*').eq('conversationId', conversationDbId).eq('active', true).limit(1);
            const { data: existingCart, error: checkError } = await query;

            if (checkError) {
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

            if (existingCart && existingCart.length > 0) {
                return existingCart[0];
            }

            const newCart = {
                id: generateCartId(),
                conversationId: conversationDbId,
                active: true,
                updatedAt: new Date().toISOString(),
            };

            let insertQuery = client.from('Cart').insert(newCart).select();
            const { data: createdCart, error: insertError } = await insertQuery;

            if (insertError) {
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
            console.error('Error al crear carrito:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async addProductToCart(env, conversationId, productId, quantity = 1) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            let cart = await this.getCart(env, conversationId);

            if (!cart) {
                cart = await this.createCart(env, conversationId);
            }

            if (!cart) {
                throw new Error('No se pudo crear o obtener el carrito');
            }

            const cartId = cart.id;
            const productIdInt = parseInt(productId);
            let query = client.from('CartItem').select('*').eq('cartId', cartId).eq('productId', productIdInt).limit(1);
            const { data: existingItem, error: checkError } = await query;

            if (checkError) {
                if (checkError.code === 'PGRST116' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
                    query = client.from('"CartItem"').select('*').eq('cartId', cartId).eq('productId', productIdInt).limit(1);
                    const { data: existingItem2, error: checkError2 } = await query;
                    if (checkError2) {
                        throw checkError2;
                    }

                    if (existingItem2 && existingItem2.length > 0) {
                        const currentQty = existingItem2[0].qty || 0;
                        const newQty = currentQty + quantity;

                        let updateQuery = client.from('"CartItem"').update({ qty: newQty }).eq('id', existingItem2[0].id).select();
                        const { data: updatedItem, error: updateError } = await updateQuery;

                        if (updateError) {
                            throw updateError;
                        }

                        await client.from('"Cart"').update({ updatedAt: new Date().toISOString() }).eq('id', cartId);
                        return await this.getCart(env, conversationId);
                    } else {
                        const newCartItem = {
                            id: `cartitem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            cartId: cartId,
                            productId: parseInt(productId),
                            qty: quantity,
                        };

                        let insertQuery = client.from('"CartItem"').insert(newCartItem).select();
                        const { data: createdItem, error: insertError } = await insertQuery;

                        if (insertError) {
                            throw insertError;
                        }

                        await client.from('"Cart"').update({ updatedAt: new Date().toISOString() }).eq('id', cartId);
                        return await this.getCart(env, conversationId);
                    }
                }
                throw checkError;
            }

            if (existingItem && existingItem.length > 0) {
                const currentQty = existingItem[0].qty || 0;
                const newQty = currentQty + quantity;

                let updateQuery = client.from('CartItem').update({ qty: newQty }).eq('id', existingItem[0].id).select();
                const { data: updatedItem, error: updateError } = await updateQuery;

                if (updateError) {
                    throw updateError;
                }

                await client.from('Cart').update({ updatedAt: new Date().toISOString() }).eq('id', cartId);
                return await this.getCart(env, conversationId);
            } else {
                const newCartItem = {
                    id: `cartitem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    cartId: cartId,
                    productId: parseInt(productId),
                    qty: quantity,
                };

                let insertQuery = client.from('CartItem').insert(newCartItem).select();
                const { data: createdItem, error: insertError } = await insertQuery;

                if (insertError) {
                    throw insertError;
                }

                await client.from('Cart').update({ updatedAt: new Date().toISOString() }).eq('id', cartId);
                return await this.getCart(env, conversationId);
            }

        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    async updateCart(env, conversationId, updates) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            const cart = await this.getCart(env, conversationId);

            if (!cart) {
                throw new Error('El carrito no existe. Crea un carrito primero.');
            }

            const cartId = cart.id;

            for (const update of updates) {
                const { product_id, quantity } = update;

                if (!product_id) {
                    console.warn('updateCart: product_id es requerido, ignorando actualización:', update);
                    continue;
                }

                const productIdInt = parseInt(product_id);
                let query = client.from('CartItem').select('*').eq('cartId', cartId).eq('productId', productIdInt).limit(1);
                const { data: existingItem, error: checkError } = await query;

                let itemExists = false;
                let itemId = null;

                if (checkError) {
                    if (checkError.code === 'PGRST116' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
                        query = client.from('"CartItem"').select('*').eq('cartId', cartId).eq('productId', productIdInt).limit(1);
                        const { data: existingItem2, error: checkError2 } = await query;
                        if (checkError2) {
                            throw checkError2;
                        }
                        if (existingItem2 && existingItem2.length > 0) {
                            itemExists = true;
                            itemId = existingItem2[0].id;
                        }
                    } else {
                        throw checkError;
                    }
                } else if (existingItem && existingItem.length > 0) {
                    itemExists = true;
                    itemId = existingItem[0].id;
                }

                if (quantity === 0 || quantity === null || quantity === undefined) {
                    if (itemExists && itemId) {
                        let deleteQuery = client.from('CartItem').delete().eq('id', itemId);
                        if (checkError && (checkError.code === 'PGRST116' || checkError.message?.includes('relation'))) {
                            deleteQuery = client.from('"CartItem"').delete().eq('id', itemId);
                        }
                        const { error: deleteError } = await deleteQuery;
                        if (deleteError) {
                            throw deleteError;
                        }
                    }
                } else {
                    if (itemExists && itemId) {
                        let updateQuery = client.from('CartItem').update({ qty: quantity }).eq('id', itemId);
                        if (checkError && (checkError.code === 'PGRST116' || checkError.message?.includes('relation'))) {
                            updateQuery = client.from('"CartItem"').update({ qty: quantity }).eq('id', itemId);
                        }
                        const { error: updateError } = await updateQuery;
                        if (updateError) {
                            throw updateError;
                        }
                    } else {
                        const newCartItem = {
                            id: `cartitem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            cartId: cartId,
                            productId: parseInt(product_id),
                            qty: quantity,
                        };

                        let insertQuery = client.from('CartItem').insert(newCartItem);
                        if (checkError && (checkError.code === 'PGRST116' || checkError.message?.includes('relation'))) {
                            insertQuery = client.from('"CartItem"').insert(newCartItem);
                        }
                        const { error: insertError } = await insertQuery;
                        if (insertError) {
                            throw insertError;
                        }
                    }
                }
            }

            await client.from('Cart').update({ updatedAt: new Date().toISOString() }).eq('id', cartId);
            return await this.getCart(env, conversationId);

        } catch (error) {
            console.error('Error al actualizar carrito:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },

    getUnitPriceByQuantity(product, quantity) {
        if (quantity >= 200 && product.price200 !== null && product.price200 !== undefined) {
            return parseFloat(product.price200 || 0);
        } else if (quantity >= 100 && product.price100 !== null && product.price100 !== undefined) {
            return parseFloat(product.price100 || 0);
        } else if (quantity >= 50 && product.price50 !== null && product.price50 !== undefined) {
            return parseFloat(product.price50 || 0);
        } else {
            return parseFloat(product.price50 || product.price || 0);
        }
    },

    async getCartTotal(env, conversationId) {
        const client = createSupabaseClient(env);

        if (!client) {
            return null;
        }

        try {
            const cart = await this.getCart(env, conversationId);

            if (!cart) {
                return 0;
            }

            const cartId = cart.id;

            let query = client.from('CartItem').select('*').eq('cartId', cartId);
            const { data: cartItems, error: itemsError } = await query;

            let items = [];
            if (itemsError) {
                if (itemsError.code === 'PGRST116' || itemsError.message?.includes('relation') || itemsError.message?.includes('does not exist')) {
                    query = client.from('"CartItem"').select('*').eq('cartId', cartId);
                    const { data: cartItems2, error: itemsError2 } = await query;
                    if (itemsError2) {
                        throw itemsError2;
                    }
                    items = cartItems2 || [];
                } else {
                    throw itemsError;
                }
            } else {
                items = cartItems || [];
            }

            if (items.length === 0) {
                return 0;
            }

            const productIds = [...new Set(items.map(item => item.productId))];
            const products = await ProductService.getByIds(env, productIds);

            if (!products || products.length === 0) {
                return 0;
            }

            const productsMap = {};
            products.forEach(product => {
                productsMap[product.id] = product;
            });

            let total = 0;

            items.forEach(cartItem => {
                const product = productsMap[cartItem.productId];

                if (product) {
                    const quantity = parseInt(cartItem.qty || 0);

                    if (quantity > 0) {
                        const unitPrice = this.getUnitPriceByQuantity(product, quantity);
                        const itemTotal = unitPrice * quantity;
                        total += itemTotal;
                    }
                }
            });

            return parseFloat(total.toFixed(2));

        } catch (error) {
            console.error('Error al calcular total del carrito:', error);
            const enhancedError = new Error(error?.message || String(error));
            enhancedError.details = error?.details;
            enhancedError.hint = error?.hint;
            enhancedError.code = error?.code;
            throw enhancedError;
        }
    },
};
