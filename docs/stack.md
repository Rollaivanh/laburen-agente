# Stack Tecnológico

Esta sección describe las tecnologías utilizadas en el proyecto.

## Backend

**Cloudflare Workers** - Plataforma serverless donde se ejecuta el código. Es rápida, económica y se escala automáticamente. No requiere gestión de servidores.

**Node.js** - Runtime utilizado por Cloudflare Workers. Implementado en JavaScript estándar.

## Base de Datos

**Supabase** - Base de datos PostgreSQL con API REST automática. Se utiliza para almacenar productos, carritos y conversaciones.

## Protocolo

**MCP (Model Context Protocol)** - Protocolo utilizado por Laburen para comunicarse con el bot. Basado en JSON-RPC 2.0 con extensiones específicas. El bot envía requests y el sistema responde con los datos solicitados.

## Herramientas

**Wrangler** - CLI de Cloudflare para desplegar y gestionar workers. Se utiliza para subir código, ver logs y configurar variables de entorno.

## Dependencias

- `@supabase/supabase-js` - Cliente oficial de Supabase para conectarse a la base de datos
- `wrangler` - Herramienta de desarrollo para desplegar y probar

## Cómo Funciona

1. El bot de Laburen envía un request HTTP al worker
2. El worker procesa el request según el método (tools/list, tools/call, etc.)
3. Si requiere datos, consulta Supabase
4. Devuelve la respuesta en formato JSON-RPC 2.0
