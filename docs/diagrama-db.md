# Diagrama de la Base de Datos

Esta sección describe la estructura de la base de datos. Consta de 4 tablas principales.

## Tablas

### Product

Guarda todos los productos que vendemos.

```
- id (integer, PK)
- name (string) - Ej: "Camiseta", "Pantalon"
- color (string) - Ej: "Negro", "Blanco"
- description (string) - Descripción del producto
- stock (integer) - Cantidad disponible
- price (decimal) - Precio base
- price50 (decimal) - Precio si comprás 50 o más
- price100 (decimal) - Precio si comprás 100 o más
- price200 (decimal) - Precio si comprás 200 o más
```

### Conversation

Guarda las conversaciones del bot. Cada vez que alguien habla con el bot, se crea o actualiza una conversación.

```
- id (text, PK) - ID interno de la BD
- conversationId (text, unique) - ID que viene de Chatwoot/Laburen
- state (string) - Estado de la conversación (ej: "IDLE")
- updatedAt (timestamp) - Última actualización
```

### Cart

El carrito de compras. Cada conversación puede tener un carrito activo.

```
- id (text, PK)
- conversationId (text, FK -> Conversation.id) - Relación con la conversación
- active (boolean) - Si está activo o no
- createdAt (timestamp) - Cuándo se creó
- updatedAt (timestamp) - Última actualización
```

### CartItem

Los items que están dentro del carrito. Acá se guarda qué productos y cuántos.

```
- id (text, PK)
- cartId (text, FK -> Cart.id) - A qué carrito pertenece
- productId (integer, FK -> Product.id) - Qué producto es
- qty (integer) - Cantidad de ese producto
```

## Relaciones

```
Conversation (1) ----< (N) Cart
Cart (1) ----< (N) CartItem
CartItem (N) >---- (1) Product
```

Resumen de relaciones:
- Una conversación puede tener varios carritos (pero solo uno activo a la vez)
- Un carrito puede tener varios items
- Cada item apunta a un producto

## Cómo se Usa

1. Cuando alguien habla con el bot, se crea/actualiza una `Conversation`
2. Si el usuario quiere comprar algo, se crea un `Cart` para esa conversación
3. Cuando agregan productos, se crean `CartItem` que apuntan al `Cart` y al `Product`
4. Para calcular el total, se buscan los `CartItem`, se traen los `Product` y se calcula según la cantidad (price50, price100, price200)

La estructura es simple y utiliza foreign keys para mantener la integridad de los datos.
