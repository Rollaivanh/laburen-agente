/**
 * MCP básico para Laburen Challenge
 * Implementación mínima del protocolo MCP para probar conexión
 */

import { ProductService } from './product.js';
import { CartService } from './cart.js';

// Headers CORS completos
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
  'Access-Control-Max-Age': '86400', // 24 horas
  'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
};

// Funciones auxiliares
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function sseResponse(data, eventType = 'manifest', status = 200) {
  // Validar que data existe
  if (data === undefined || data === null) {
    data = { error: 'No data provided' };
  }

  try {
    // Formatear datos como Server-Sent Events
    // Formato esperado: "event: {type}\ndata: {json}\n\n"
    let jsonData;
    try {
      jsonData = JSON.stringify(data);
    } catch (jsonError) {
      jsonData = JSON.stringify({ error: 'Failed to stringify data', original: String(data) });
    }

    // Formato SSE correcto para Laburen: "event: {type}\ndata: {json}\n\n"
    // Asegurar que no haya espacios extra y que los saltos de línea sean correctos
    const sseData = `event: ${eventType}\ndata: ${jsonData}\n\n`;

    // Headers para SSE con charset UTF-8
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('X-Accel-Buffering', 'no'); // Deshabilitar buffering en nginx

    // Agregar headers CORS
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Crear Response con codificación UTF-8 explícita
    return new Response(sseData, {
      status,
      headers,
    });
  } catch (error) {
    // Si hay error, devolver JSON normal con información del error
    return jsonResponse({
      error: 'SSE conversion failed',
      message: error?.message || String(error),
      stack: error?.stack,
    }, status);
  }
}

// Definir el manifest una sola vez
const manifest = {
  schema_version: 'v1',
  name: 'laburen-mcp-basic',
  description: 'MCP básico para Laburen Challenge',
  tools: [
    {
      name: 'test_connection',
      description: 'Función de prueba para verificar la conexión con el MCP',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Mensaje de prueba opcional',
          },
        },
        required: [],
      },
    },
    {
      name: 'list_products',
      description: 'Lista productos disponibles. Permite filtrar por name, color, stock y description.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Filtrar por nombre del producto igual que como aparece en available_products',
          },
          color: {
            type: 'string',
            description: 'Filtrar por color exacto del producto, los colores deben estar en masculino, ej: Negro',
          },

          description: {
            type: 'string',
            description: 'Filtrar por descripción usando búsqueda parcial (case-insensitive)',
          },
        },
        required: [],
      },
    },
    {
      name: 'available_products',
      description: 'Obtiene un listado de productos disponibles para asesorar rápidamente al cliente.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'top_products_by_stock',
      description: 'Obtiene el top 3 productos con más stock o volumen disponible.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'create_cart',
      description: 'Crea un carrito de compras para un conversation_id. Si ya existe un carrito para ese conversation_id, lo devuelve.',
      inputSchema: {
        type: 'object',
        properties: {
          conversation_id: {
            type: 'string',
            description: 'ID de la conversación para asociar el carrito',
          },
        },
        required: ['conversation_id'],
      },
    },
    {
      name: 'get_cart',
      description: 'Busca un carrito existente para un conversation_id. Si no existe, no crea nada y devuelve null.',
      inputSchema: {
        type: 'object',
        properties: {
          conversation_id: {
            type: 'string',
            description: 'ID de la conversación para buscar el carrito',
          },
        },
        required: ['conversation_id'],
      },
    },
  ],
};

// Función para crear respuesta JSON-RPC 2.0
function jsonRpcResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: '2.0',
    id: id,
  };

  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  return jsonResponse(response);
}

// Función para manejar métodos JSON-RPC
async function handleJsonRpcMethod(method, params, id, env) {
  switch (method) {
    case 'initialize':
      // Handshake inicial del protocolo MCP
      return jsonRpcResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: manifest.name,
          version: '1.0.0',
        },
      });

    case 'tools/list':
      // Listar herramientas disponibles
      return jsonRpcResponse(id, {
        tools: manifest.tools,
      });

    case 'tools/call':
      // Ejecutar una herramienta
      const { name, arguments: args } = params || {};

      if (name === 'test_connection') {
        return jsonRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: `✅ Conexión exitosa con el MCP! ${args?.message || 'Todo funcionando correctamente.'}`,
            },
          ],
        });
      }

      if (name === 'list_products') {
        try {
          // Construir filtros desde los argumentos
          const filters = {};
          if (args?.name) filters.name = args.name;
          if (args?.color) filters.color = args.color;
          if (args?.description) filters.description = args.description;

          // Obtener productos desde Supabase
          const products = await ProductService.list(env, filters);

          if (!products) {
            return jsonRpcResponse(id, null, {
              code: -32603,
              message: 'Supabase no está configurado',
              data: {
                error: 'Las variables de entorno SUPABASE_URL y SUPABASE_KEY no están configuradas',
              },
            });
          }

          return jsonRpcResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    total: products.length,
                    products: products,
                  },
                  null,
                  2
                ),
              },
            ],
          });
        } catch (error) {
          // Mejorar el manejo de errores para mostrar más información
          const errorMessage = error?.message || String(error);
          const errorDetails = error?.details || error?.hint || null;
          const errorCode = error?.code || null;

          return jsonRpcResponse(id, null, {
            code: -32603,
            message: 'Error al obtener productos desde Supabase',
            data: {
              error: errorMessage,
              details: errorDetails,
              code: errorCode,
              fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
          });
        }
      }

      if (name === 'available_products') {
        try {
          // Obtener productos disponibles desde Supabase
          const productNames = await ProductService.listAvailable(env);

          if (!productNames) {
            return jsonRpcResponse(id, null, {
              code: -32603,
              message: 'Supabase no está configurado',
              data: {
                error: 'Las variables de entorno SUPABASE_URL y SUPABASE_KEY no están configuradas',
              },
            });
          }

          return jsonRpcResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    total: productNames.length,
                    products: productNames,
                  },
                  null,
                  2
                ),
              },
            ],
          });
        } catch (error) {
          const errorMessage = error?.message || String(error);
          const errorDetails = error?.details || error?.hint || null;
          const errorCode = error?.code || null;

          return jsonRpcResponse(id, null, {
            code: -32603,
            message: 'Error al obtener productos disponibles desde Supabase',
            data: {
              error: errorMessage,
              details: errorDetails,
              code: errorCode,
              fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
          });
        }
      }

      if (name === 'top_products_by_stock') {
        try {
          // Obtener top 3 productos por stock desde Supabase
          const products = await ProductService.topProductsByStock(env);

          if (!products) {
            return jsonRpcResponse(id, null, {
              code: -32603,
              message: 'Supabase no está configurado',
              data: {
                error: 'Las variables de entorno SUPABASE_URL y SUPABASE_KEY no están configuradas',
              },
            });
          }

          return jsonRpcResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    total: products.length,
                    products: products,
                  },
                  null,
                  2
                ),
              },
            ],
          });
        } catch (error) {
          const errorMessage = error?.message || String(error);
          const errorDetails = error?.details || error?.hint || null;
          const errorCode = error?.code || null;

          return jsonRpcResponse(id, null, {
            code: -32603,
            message: 'Error al obtener top productos por stock desde Supabase',
            data: {
              error: errorMessage,
              details: errorDetails,
              code: errorCode,
              fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
          });
        }
      }

      if (name === 'create_cart') {
        try {
          const conversationId = args?.conversation_id;

          if (!conversationId) {
            return jsonRpcResponse(id, null, {
              code: -32602,
              message: 'Invalid params',
              data: {
                error: 'conversation_id es requerido',
              },
            });
          }

          // Crear o obtener carrito desde Supabase
          const cart = await CartService.createCart(env, conversationId);

          if (!cart) {
            return jsonRpcResponse(id, null, {
              code: -32603,
              message: 'Supabase no está configurado',
              data: {
                error: 'Las variables de entorno SUPABASE_URL y SUPABASE_KEY no están configuradas',
              },
            });
          }

          return jsonRpcResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cart: cart,
                  },
                  null,
                  2
                ),
              },
            ],
          });
        } catch (error) {
          const errorMessage = error?.message || String(error);
          const errorDetails = error?.details || error?.hint || null;
          const errorCode = error?.code || null;

          return jsonRpcResponse(id, null, {
            code: -32603,
            message: 'Error al crear carrito desde Supabase',
            data: {
              error: errorMessage,
              details: errorDetails,
              code: errorCode,
              fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
          });
        }
      }

      if (name === 'get_cart') {
        try {
          const conversationId = args?.conversation_id;

          if (!conversationId) {
            return jsonRpcResponse(id, null, {
              code: -32602,
              message: 'Invalid params',
              data: {
                error: 'conversation_id es requerido',
              },
            });
          }

          // Buscar carrito existente desde Supabase (no crea si no existe)
          const cart = await CartService.getCart(env, conversationId);

          if (cart === undefined) {
            return jsonRpcResponse(id, null, {
              code: -32603,
              message: 'Supabase no está configurado',
              data: {
                error: 'Las variables de entorno SUPABASE_URL y SUPABASE_KEY no están configuradas',
              },
            });
          }

          return jsonRpcResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    cart: cart,
                    exists: cart !== null,
                  },
                  null,
                  2
                ),
              },
            ],
          });
        } catch (error) {
          const errorMessage = error?.message || String(error);
          const errorDetails = error?.details || error?.hint || null;
          const errorCode = error?.code || null;

          return jsonRpcResponse(id, null, {
            code: -32603,
            message: 'Error al buscar carrito desde Supabase',
            data: {
              error: errorMessage,
              details: errorDetails,
              code: errorCode,
              fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
          });
        }
      }

      // Herramienta no encontrada
      return jsonRpcResponse(id, null, {
        code: -32601,
        message: `Method not found: ${name}`,
        data: {
          tool: name,
        },
      });

    default:
      // Método no soportado
      return jsonRpcResponse(id, null, {
        code: -32601,
        message: `Method not found: ${method}`,
      });
  }
}

export default {
  async fetch(request, env, ctx) {
    // Manejar preflight CORS (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Endpoint /mcp - Implementación correcta del protocolo MCP
      if (path === '/mcp') {
        // GET /mcp con Accept: text/event-stream → SSE manifest
        if (request.method === 'GET') {
          const acceptHeader = request.headers.get('accept') || '';
          const wantsSSE = acceptHeader.includes('text/event-stream');

          if (wantsSSE) {
            return sseResponse(manifest, 'manifest');
          }

          // Si no pide SSE, devolver JSON
          return jsonResponse(manifest);
        }

        // POST /mcp → JSON-RPC 2.0
        if (request.method === 'POST') {
          let body;
          try {
            body = await request.json();
          } catch (e) {
            return jsonRpcResponse(null, null, {
              code: -32700,
              message: 'Parse error',
            });
          }

          // Validar formato JSON-RPC 2.0 básico
          if (!body.jsonrpc || body.jsonrpc !== '2.0') {
            return jsonRpcResponse(body.id || null, null, {
              code: -32600,
              message: 'Invalid Request',
            });
          }

          if (!body.method) {
            return jsonRpcResponse(body.id || null, null, {
              code: -32600,
              message: 'Invalid Request: method is required',
            });
          }

          // Procesar método JSON-RPC
          return await handleJsonRpcMethod(body.method, body.params, body.id, env);
        }

        // Método no permitido
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      // Endpoint raíz - información del servidor MCP (JSON para verificación)
      if (path === '/') {
        return jsonResponse(manifest);
      }

      // Endpoint /sse - siempre devuelve SSE (compatibilidad)
      if (path === '/sse') {
        // Crear stream SSE con manifest primero y luego pings periódicos
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            // Enviar manifest primero
            const jsonData = JSON.stringify(manifest);
            const manifestData = encoder.encode(`event: manifest\ndata: ${jsonData}\n\n`);
            controller.enqueue(manifestData);

            // Enviar pings periódicos cada 30 segundos
            const sendPings = async () => {
              let pingCount = 0;
              while (pingCount < 100) {
                await new Promise(resolve => setTimeout(resolve, 30000));
                try {
                  const pingData = encoder.encode(`event: ping\ndata: {}\n\n`);
                  controller.enqueue(pingData);
                  pingCount++;
                } catch (error) {
                  break;
                }
              }
            };

            if (ctx) {
              ctx.waitUntil(sendPings());
            } else {
              sendPings();
            }
          },
        });

        const headers = new Headers();
        headers.set('Content-Type', 'text/event-stream; charset=utf-8');
        headers.set('Cache-Control', 'no-cache');
        headers.set('Connection', 'keep-alive');
        headers.set('X-Accel-Buffering', 'no');

        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });

        return new Response(stream, {
          status: 200,
          headers,
        });
      }

      // Endpoint de salud
      if (path === '/health') {
        return jsonResponse({
          status: 'ok',
          timestamp: new Date().toISOString(),
        });
      }

      return jsonResponse({ error: 'Endpoint no encontrado' }, 404);
    } catch (error) {
      return jsonResponse(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message,
          },
        },
        500
      );
    }
  },
};
