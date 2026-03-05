# Radar Político

Monitoreo de redes sociales, análisis de sentimiento y estrategia de campaña — en tiempo real.

---

## ¿Qué es?

Radar Político es una plataforma demo que permite al equipo de campaña de un candidato político visualizar en tiempo real:

- Menciones y alcance en redes sociales
- Análisis de sentimiento (positivo / negativo / neutro)
- Mapa de calor de aprobación por estado
- Comparativo contra candidatos rivales
- Demandas ciudadanas y temas en tendencia
- Proyecciones con regresión lineal
- Recomendaciones estratégicas automatizadas
- Asistente IA conversacional con contexto del monitor

---

## Estructura del proyecto

```
Monitor redes/
├── backend/
│   ├── server.js           # API Express + integración OpenAI
│   ├── package.json
│   ├── .env.example        # Plantilla de variables de entorno
│   ├── .gitignore
│   └── data/
│       └── dashboard.json  # Todos los datos del monitor
└── frontend/
    └── index.html          # Dashboard (HTML + CSS + JS)
```

---

## Requisitos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Cuenta en [OpenAI](https://platform.openai.com) con API key

---

## Instalación y arranque

### 1. Clonar / descargar el proyecto

```bash
cd "Monitor redes"
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar la API key de OpenAI

```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tu key:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
PORT=3000
```

### 4. Iniciar el servidor

```bash
npm start
```

El servidor levanta en **http://localhost:3000**

> Para desarrollo con recarga automática:
> ```bash
> npm run dev
> ```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/data` | Retorna todos los datos del monitor en JSON |
| `POST` | `/api/chat` | Consulta al asistente IA con contexto del monitor |

### Ejemplo: consultar datos

```bash
curl http://localhost:3000/api/data
```

### Ejemplo: usar el chat IA

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"¿Qué estados son de mayor riesgo?"}]}'
```

---

## Datos del monitor (`dashboard.json`)

El archivo `backend/data/dashboard.json` contiene toda la información que alimenta el dashboard. Se puede editar directamente o reemplazar con datos reales de scraping.

### Estructura principal

```json
{
  "meta":        { "candidate", "party", "role", "period" },
  "kpis":        { "totalMentions", "reach", "approvalIndex", "sentiment", ... },
  "engagement":  { "likes", "comments", "shares" },
  "daily":       [ { "d", "m", "p", "n", "r" } ],
  "platforms":   [ { "n", "e", "pct", "c" } ],
  "states":      [ { "id", "name", "a", "men", "lat", "lng" } ],
  "topics":      [ { "t", "c", "s", "sz" } ],
  "demands":     [ { "t", "p", "i" } ],
  "strategy":    [ { "i", "c", "t", "d" } ],
  "mentions":    [ { "src", "dom", "date", "s", "txt" } ],
  "tiktok":      [ { "video_id", "url", "descripcion", "fecha", "views", ... } ],
  "competitors": [ { "name", "party", "approval", "positive", "negative", ... } ]
}
```

### Campos de datos diarios (`daily`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `d` | string | Etiqueta del día (`"3/M"`) |
| `m` | number | Total de menciones |
| `p` | number | Menciones positivas |
| `n` | number | Menciones negativas |
| `r` | number | Alcance (personas impactadas) |

### Schema TikTok (`tiktok`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `video_id` | string | ID único del video |
| `url` | string | URL del video |
| `descripcion` | string | Descripción / caption |
| `fecha` | string | Fecha de publicación (YYYY-MM-DD) |
| `duracion_seg` | number | Duración en segundos |
| `views` | number | Visualizaciones |
| `likes` | number | Likes |
| `comentarios` | number | Comentarios |
| `shares` | number | Compartidos |
| `usuario` | string | Username |
| `nombre` | string | Nombre de pantalla |
| `seguidores` | number | Seguidores de la cuenta |
| `verificado` | boolean | Cuenta verificada |
| `hashtags` | array | Lista de hashtags |
| `keyword` | string | Keyword que disparó el scraping |
| `scraped_at` | string | Timestamp del scraping (ISO 8601) |

---

## Asistente IA

El asistente usa **gpt-4o-mini** de OpenAI. El system prompt se construye dinámicamente con:

- Datos del candidato monitoreado
- Métricas del periodo (menciones, alcance, sentimiento)
- Aprobación por los 31 estados
- Demandas ciudadanas
- Comparativo de candidatos rivales
- Eventos clave del periodo

El historial de conversación se mantiene en el frontend durante la sesión.

---

## Despliegue en servidor

El backend de Express sirve el frontend como archivos estáticos desde `../frontend/`. Solo necesitas exponer el puerto del backend.

### Con PM2 (recomendado)

```bash
npm install -g pm2
cd backend
pm2 start server.js --name politiq
pm2 save
```

### Variables de entorno en producción

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
PORT=3000
```

> **Importante:** Nunca subas el archivo `.env` al repositorio. El `.gitignore` ya lo excluye.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 · CSS3 · JavaScript vanilla |
| Mapas | Leaflet.js + CartoDB Dark Matter tiles |
| Gráficas | Canvas API (sin dependencias externas) |
| Backend | Node.js + Express |
| IA | OpenAI API (`gpt-4o-mini`) |
| Datos | JSON estático (reemplazable con DB) |

---

## Próximos pasos sugeridos

- [ ] Conectar scraper real de TikTok / X / Noticias → reemplaza `dashboard.json`
- [ ] Agregar autenticación al dashboard
- [ ] Endpoint `PUT /api/data` para actualizar datos desde el scraper
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Soporte multi-candidato (un dashboard por cliente)
