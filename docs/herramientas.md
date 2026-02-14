# Documentación de Herramientas

Esta sección describe todas las herramientas disponibles para el bot. Son 9 en total.

## 1. test_connection

Para probar que todo funciona. No hace nada importante, solo devuelve un mensaje.

**Parámetros:**
- `message` (opcional) - Un mensaje de prueba

**Ejemplo:**
```json
{
  "name": "test_connection",
  "arguments": {
    "message": "Hola!"
  }
}
```

## 2. list_products

Lista productos con filtros. Permite buscar por nombre, color o descripción.

**IMPORTANTE:** Si el usuario menciona un tipo de producto como "pantalones" o "remera", se debe usar el parámetro `name`, no `description`. El parámetro `description` se utiliza únicamente para buscar características específicas como "algodón" o "manga larga".

**Parámetros:**
- `name` (opcional) - Tipo de producto. Valores permitidos: "Camisa", "Camiseta", "Chaqueta", "Falda", "Pantalon", "Sudadera"
- `color` (opcional) - Color del producto
- `description` (opcional) - Características del producto (NO usar para tipos de producto)

**Ejemplo:**
```json
{
  "name": "list_products",
  "arguments": {
    "name": "Pantalon",
    "color": "Negro"
  }
}
```

## 3. available_products

Proporciona un listado de productos que tienen stock disponible. Devuelve solo los nombres para que el bot pueda informar al usuario qué productos están disponibles.

**Parámetros:**
Ninguno

**Ejemplo:**
```json
{
  "name": "available_products",
  "arguments": {}
}
```

## 4. top_products_by_stock

Muestra los 3 productos con mayor stock disponible. Útil para recomendar productos cuando hay disponibilidad alta.

**Parámetros:**
Ninguno

**Ejemplo:**
```json
{
  "name": "top_products_by_stock",
  "arguments": {}
}
```

## 5. create_cart

Crea un carrito para una conversación. Si ya existe uno, te lo devuelve.

**Parámetros:**
- `conversation_id` (requerido) - ID de la conversación

**Ejemplo:**
```json
{
  "name": "create_cart",
  "arguments": {
    "conversation_id": "conv_abc123"
  }
}
```

## 6. get_cart

Busca un carrito existente. Si no existe, devuelve null (no crea nada).

**Parámetros:**
- `conversation_id` (requerido) - ID de la conversación

**Ejemplo:**
```json
{
  "name": "get_cart",
  "arguments": {
    "conversation_id": "conv_abc123"
  }
}
```

## 7. add_product_to_cart

Agrega un producto al carrito. Si el producto ya está, le suma la cantidad. Si el carrito no existe, lo crea automáticamente.

**Parámetros:**
- `conversation_id` (requerido) - ID de la conversación
- `product_id` (requerido) - ID del producto
- `quantity` (opcional) - Cantidad a agregar (default: 1)

**Ejemplo:**
```json
{
  "name": "add_product_to_cart",
  "arguments": {
    "conversation_id": "conv_abc123",
    "product_id": "prod_456",
    "quantity": 3
  }
}
```

## 8. update_cart

Actualiza productos en el carrito. Permite modificar cantidades o eliminar productos estableciendo quantity en 0.

**Parámetros:**
- `conversation_id` (requerido) - ID de la conversación
- `updates` (requerido) - Array de actualizaciones. Cada una tiene `product_id` y `quantity`

**Ejemplo:**
```json
{
  "name": "update_cart",
  "arguments": {
    "conversation_id": "conv_abc123",
    "updates": [
      {
        "product_id": "prod_456",
        "quantity": 5
      },
      {
        "product_id": "prod_789",
        "quantity": 0
      }
    ]
  }
}
```

## 9. get_cart_total

Calcula el total del carrito. Tiene en cuenta los precios por volumen (price50, price100, price200) según la cantidad de cada producto.

**Cómo funciona el precio por volumen:**
- Si hay 50 o más unidades de un producto → se usa `price50`
- Si hay 100 o más → se usa `price100`
- Si hay 200 o más → se usa `price200`
- Si hay menos de 50 → se usa `price50` (o el precio base)

**Parámetros:**
- `conversation_id` (requerido) - ID de la conversación

**Ejemplo:**
```json
{
  "name": "get_cart_total",
  "arguments": {
    "conversation_id": "conv_abc123"
  }
}
```

**Respuesta:**
Devuelve únicamente el número del total, redondeado a 2 decimales. Ejemplo: `150.50`

## Cuándo Usar Cada Una

- **list_products**: Cuando el usuario busca algo específico
- **available_products**: Para mostrar qué hay disponible rápido
- **top_products_by_stock**: Para recomendar productos con mucho stock
- **create_cart**: Cuando el usuario quiere empezar a comprar
- **get_cart**: Para ver qué tiene en el carrito
- **add_product_to_cart**: Cuando el usuario quiere agregar algo
- **update_cart**: Para modificar o quitar productos
- **get_cart_total**: Cuando el usuario pregunta "cuánto es" o "cuánto tengo"

## Formato de Respuesta

Todas las respuestas vienen en formato JSON-RPC 2.0. Si hay un error, viene con un código y mensaje. Si todo sale bien, los datos están en `result.content[0].text` como JSON stringificado.
