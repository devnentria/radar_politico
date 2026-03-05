'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const OpenAI  = require('openai');

const app  = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

/* ── Static frontend ── */
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ── GET /api/data ── */
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'dashboard.json'), 'utf-8')
    );
    res.json(data);
  } catch (e) {
    console.error('Error reading dashboard.json:', e.message);
    res.status(500).json({ error: 'No se pudieron cargar los datos.' });
  }
});

/* ── POST /api/chat ── */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'El campo "messages" es requerido.' });
  }

  let data;
  try {
    data = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'dashboard.json'), 'utf-8')
    );
  } catch (e) {
    return res.status(500).json({ error: 'No se pudieron cargar los datos del monitor.' });
  }

  /* Resumen dinámico de estados para el contexto */
  const statesSummary = data.states
    .sort((a, b) => b.a - a.a)
    .map(s => `${s.name}: ${s.a}% aprobación, ${s.men.toLocaleString('es-MX')} menciones`)
    .join('\n');

  const topDemands = data.demands
    .map(d => `${d.i} ${d.t}: ${d.p}%`)
    .join('\n');

  const topTopics = data.topics
    .map(t => `${t.t} (${t.s === 'pos' ? 'positivo' : t.s === 'neg' ? 'negativo' : 'neutro'}, ${t.c} menciones)`)
    .join(', ');

  const systemPrompt = `Eres el asistente de Radar Político, un analista experto en inteligencia política y monitoreo de redes sociales al servicio del equipo estratégico de campaña. Tu rol es interpretar datos del monitor, identificar riesgos y oportunidades, y ofrecer recomendaciones accionables.

## CANDIDATA MONITOREADA
${data.meta.candidate} · ${data.meta.party} · ${data.meta.role}
Periodo: ${data.meta.period}

## MÉTRICAS CLAVE
- Total menciones: ${data.kpis.totalMentions.toLocaleString('es-MX')}
- Alcance en redes: ${(data.kpis.reach / 1e6).toFixed(1)}M personas
- Interacciones totales: ${data.kpis.interactions.toLocaleString('es-MX')}
- Índice de aprobación efectiva: ${data.kpis.approvalIndex}%
- Sentimiento POSITIVO: ${data.kpis.sentiment.positive}% | NEGATIVO: ${data.kpis.sentiment.negative}% | NEUTRO: ${data.kpis.sentiment.neutral}%
- Riesgo político actual: ${data.kpis.riskLevel} — ${data.kpis.riskDesc}
- Engagement: ${data.engagement.likes.toLocaleString('es-MX')} likes · ${data.engagement.comments.toLocaleString('es-MX')} comentarios · ${data.engagement.shares.toLocaleString('es-MX')} compartidos

## APROBACIÓN POR ESTADO (mayor a menor)
${statesSummary}

## DEMANDAS CIUDADANAS PRINCIPALES
${topDemands}

## TEMAS EN TENDENCIA
${topTopics}

## EVENTOS CLAVE DEL PERIODO
- 19 Feb: Operativo "El Mencho" → mayor pico positivo del periodo
- 22 Feb: #NadiePidioLaReforma viral → pico negativo
- 26 Feb: Alcance explosivo 10.5M en un solo día (Reforma Electoral viral)
- 27 Feb: Récord de menciones diarias: 1,930
- 3 Mar: Foto con Copa del Mundo + Bebeto → pico positivo (+67K likes TikTok)

## PLATAFORMAS
${data.platforms.map(p => `${p.n}: ${p.pct}%`).join(' · ')}

## COMPARATIVO DE CANDIDATOS
${data.competitors.map(c => `${c.name} (${c.party}): aprobación ${c.approval}%, positivo ${c.positive}%, negativo ${c.negative}%, menciones ${c.mentions.toLocaleString('es-MX')}, tendencia semana ${c.trendWeek >= 0 ? '+' : ''}${c.trendWeek}%`).join('\n')}

## REGLAS DE RESPUESTA
- Responde SIEMPRE en español
- Sé directo, conciso y orientado a la acción
- Usa datos concretos cuando sea relevante
- Si te preguntan por un estado específico, usa los datos del monitor
- Ofrece recomendaciones tácticas claras (qué hacer, dónde, cuándo)
- Si no tienes datos para algo específico, dilo con claridad y sugiere alternativas`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 800,
      temperature: 0.7
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (e) {
    console.error('OpenAI error:', e.message);
    const status = e.status || 500;
    res.status(status).json({ error: 'Error al consultar la IA: ' + e.message });
  }
});

/* ── Root fallback → frontend ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Radar Político corriendo en http://localhost:${PORT}`);
  console.log(`   API datos:  http://localhost:${PORT}/api/data`);
  console.log(`   API chat:   http://localhost:${PORT}/api/chat  [POST]\n`);
});
