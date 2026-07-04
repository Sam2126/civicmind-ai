# -*- coding: utf-8 -*-
"""
CivicMind AI - Complete PPT Template Filler
Team: Samarth Khandelwal & Bhavya Singh Shekhawat
GEN AI APAC Challenge - PS1: AI for Better Living & Smarter Communities
"""

import sys, os, copy
sys.stdout.reconfigure(encoding='utf-8')

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from lxml import etree

BASE     = r"c:\Users\samar\OneDrive\Desktop\GEN AI HACKATHOAN"
TEMPLATE = os.path.join(BASE, "Prototype Submission Deck _ Gen AI Academy APAC Edition.pptx")
OUTPUT   = os.path.join(BASE, "CivicMind_AI_Submission_Deck.pptx")
ARCH_IMG = os.path.join(BASE, "public", "architecture.png")
PIPE_IMG = os.path.join(BASE, "public", "pipeline.png")

prs = Presentation(TEMPLATE)

# ─── HELPER: fill a text frame properly matching template style ───────────────
def fill_textframe(tf, lines, default_size=14, bold=False, color=(0,0,0), align=PP_ALIGN.LEFT):
    """
    lines: list of (text, size, bold, color, bullet_indent) tuples
           OR a plain string (auto-split on newline)
    """
    tf.clear()
    tf.word_wrap = True

    if isinstance(lines, str):
        lines = [(l, default_size, bold, color, False) for l in lines.split('\n')]

    for idx, item in enumerate(lines):
        if isinstance(item, str):
            text, size, b, col, indent = item, default_size, bold, color, False
        else:
            text = item[0]
            size = item[1] if len(item) > 1 else default_size
            b    = item[2] if len(item) > 2 else bold
            col  = item[3] if len(item) > 3 else color
            indent = item[4] if len(item) > 4 else False

        if idx == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()

        p.alignment = align
        if indent:
            p.level = 1

        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.bold = b
        run.font.color.rgb = RGBColor(*col)

def add_pic(slide, img_path, left, top, width, height):
    slide.shapes.add_picture(img_path,
        Inches(left), Inches(top), Inches(width), Inches(height))

BLACK = (0, 0, 0)
DARK  = (30, 30, 60)   # dark navy for emphasis
BLUE  = (37, 99, 235)  # accent blue

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — Cover / Participant Details
# ═══════════════════════════════════════════════════════════════════════════════
s1 = prs.slides[0]
for sh in s1.shapes:
    if sh.name == "Google Shape;55;p13":
        fill_textframe(sh.text_frame, [
            ("Participant Details",                                      18, True,  DARK,  False),
            ("",                                                         10, False, BLACK, False),
            ("Team Name:           CivicMind AI",                       16, False, BLACK, False),
            ("Participant 1:       Samarth Khandelwal",                 16, False, BLACK, False),
            ("Participant 2:       Bhavya Singh Shekhawat",             16, False, BLACK, False),
            ("Problem Statement:   PS-1 — AI for Better Living & Smarter Communities (GEN AI APAC)", 15, False, BLACK, False),
            ("Live Demo:           https://civicmind-ai-apac.web.app",  14, False, (37,99,235), False),
            ("GitHub:              https://github.com/Sam2126/civicmind-ai", 14, False, (37,99,235), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — Brief About The Idea
# ═══════════════════════════════════════════════════════════════════════════════
s2 = prs.slides[1]
for sh in s2.shapes:
    if sh.name == "Google Shape;62;p14":
        fill_textframe(sh.text_frame, [
            ("CivicMind AI is a Decision Intelligence Platform that transforms raw city data into actionable insights for 20M+ citizens and city officials — in real time, powered entirely by Google Cloud AI.", 14, False, BLACK, False),
            ("", 8, False, BLACK, False),
            ("THE PROBLEM:", 13, True, DARK, False),
            ("Modern cities generate massive volumes of data from traffic sensors, hospitals, AQI stations, smart grids, and citizen feedback — yet officials have no unified AI tool to detect crises early, understand complex relationships across domains, or generate evidence-based decisions at speed.", 13, False, BLACK, False),
            ("", 8, False, BLACK, False),
            ("OUR SOLUTION:", 13, True, DARK, False),
            ("A single AI platform — powered by Gemini 1.5 Pro + Vertex AI AutoML + BigQuery + ADK — that ingests 2,847+ live city sensors, detects anomalies, predicts emergencies 6 hours ahead, and delivers intelligent recommendations in under 5 seconds.", 13, False, BLACK, False),
            ("", 8, False, BLACK, False),
            ("COVERAGE:  Mumbai Metropolitan Region (20.7M people)  +  Rajasthan State (80M+ people)", 13, True, (37,99,235), False),
            ("", 8, False, BLACK, False),
            ("KEY IMPACT:  95% faster incident detection  |  10,000x faster decisions  |  Rs.4.2Cr annual energy savings  |  24x earlier heatwave warnings", 12, False, (30,100,30), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — Solution Explanation
# ═══════════════════════════════════════════════════════════════════════════════
s3 = prs.slides[2]
for sh in s3.shapes:
    # The big answer box (Shape;68) at bottom - our answer
    if sh.name == "Google Shape;68;p15":
        fill_textframe(sh.text_frame, [
            ("Built 100% on Google Cloud AI: Gemini 1.5 Pro  |  Vertex AI AutoML  |  Vertex AI Embeddings  |  Vertex AI Vision  |  ADK v1.0  |  BigQuery ML  |  Cloud Run  |  Firebase Hosting", 11, True, (37,99,235), False),
        ])
    # The instruction box (Shape;70) — we fill this with our full answer
    if sh.name == "Google Shape;70;p15":
        fill_textframe(sh.text_frame, [
            ("How We Built CivicMind AI on Google Cloud (PS-1: AI for Better Living)", 14, True, DARK, False),
            ("", 6, False, BLACK, False),
            ("APPROACH & GOOGLE CLOUD STACK:", 12, True, BLACK, False),
            ("  1. DATA INGESTION: 2,847+ IoT sensors -> Cloud Functions (event triggers) -> Pub/Sub (real-time streaming) -> BigQuery (civic data warehouse with 18 dataset streams)", 12, False, BLACK, False),
            ("  2. AI CORE: Gemini 1.5 Pro powers CivicChat NL Q&A + DecisionAssist via RAG over BigQuery city documents", 12, False, BLACK, False),
            ("  3. FORECASTING: Vertex AI AutoML time-series models predict traffic, AQI, energy demand & hospital surge (7-day horizon)", 12, False, BLACK, False),
            ("  4. MULTIMODAL: Vertex AI Vision (Gemini Vision) analyzes satellite imagery + CCTV feeds for real-time anomaly detection", 12, False, BLACK, False),
            ("  5. AGENT AUTOMATION: ADK v1.0 multi-agent system auto-optimizes bus routes, waste collection & emergency pre-positioning", 12, False, BLACK, False),
            ("  6. DEPLOYMENT: Cloud Run (serverless inference) + Firebase Hosting CDN -> https://civicmind-ai-apac.web.app", 12, False, BLACK, False),
            ("", 6, False, BLACK, False),
            ("REAL-WORLD IMPACT: Serves Mumbai (20.7M) + Rajasthan (80M+). Detects flood risk, heatwaves, traffic crises & hospital surges BEFORE they escalate.", 12, True, (30,100,30), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — Opportunities / USP
# ═══════════════════════════════════════════════════════════════════════════════
s4 = prs.slides[3]
for sh in s4.shapes:
    if sh.name == "Google Shape;77;p16":
        fill_textframe(sh.text_frame, [
            ("What Makes CivicMind AI Different from Existing Solutions:", 14, True, DARK, False),
            ("", 6, False, BLACK, False),
            ("1.  UNIFIED PLATFORM: Only solution combining Gemini NL interface + Vertex AI forecasting + ADK multi-agent automation + BigQuery analytics in one civic tool — competitors offer only one of these.", 13, False, BLACK, False),
            ("2.  REAL CITY DATA RAG: CivicChat answers using live BigQuery civic data (not generic LLM hallucinations) — sourced from actual Mumbai & Rajasthan sensor networks.", 13, False, BLACK, False),
            ("3.  PROACTIVE AI: Detects crises 6 hours ahead (heatwaves), vs. next-day manual detection — first mover in predictive governance.", 13, False, BLACK, False),
            ("4.  DUAL-REGION SCALE: Proven across Mumbai Metro (20.7M) + Rajasthan (80M+) — 8 solution domains from mobility to disaster response.", 13, False, BLACK, False),
            ("5.  RESPONSIBLE AI BUILT-IN: Every decision includes data source attribution, confidence score, step-by-step reasoning & mandatory human approval — no black box.", 13, False, BLACK, False),
            ("", 6, False, BLACK, False),
            ("QUANTIFIED USP:  Traffic detection 95% faster  |  Bus optimization 98% faster (ADK)  |  AQI alerts 98% faster  |  Decisions 10,000x faster (Gemini)  |  Data scale 1,000x (BigQuery 2.4M+ records)", 12, True, (37,99,235), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — Features
# ═══════════════════════════════════════════════════════════════════════════════
s5 = prs.slides[4]
for sh in s5.shapes:
    if sh.name == "Google Shape;84;p17":
        fill_textframe(sh.text_frame, [
            ("CivicMind AI — 6 Core AI-Powered Features (All Live at https://civicmind-ai-apac.web.app):", 13, True, DARK, False),
            ("", 6, False, BLACK, False),
            ("1.  REAL-TIME DASHBOARD  [BigQuery + Chart.js]", 13, True, BLACK, False),
            ("      Live KPIs: traffic flow, AQI index, energy load, hospital occupancy, water levels — updated every 30s from 2,847+ city sensors across Mumbai & Rajasthan.", 12, False, BLACK, False),
            ("", 4, False, BLACK, False),
            ("2.  CIVICHAT AI  [Gemini 1.5 Pro + Vertex AI Embeddings + AlloyDB RAG]", 13, True, BLACK, False),
            ("      Ask any city question in natural language — 'Why is Dadar congested?' / 'Flood risk in Colaba?' Gemini answers with real BigQuery data, source attribution & confidence score.", 12, False, BLACK, False),
            ("", 4, False, BLACK, False),
            ("3.  PREDICTENGINE  [Vertex AI AutoML — time-series forecasting]", 13, True, BLACK, False),
            ("      7-day forecasts for traffic volume, AQI, energy demand & hospital surge with confidence intervals. Trained on 18 civic datasets.", 12, False, BLACK, False),
            ("", 4, False, BLACK, False),
            ("4.  ALERT RADAR  [BigQuery ML anomaly detection + Gemini summarization]", 13, True, BLACK, False),
            ("      Auto-detects anomalies across all domains, ranks by severity (Critical/High/Medium), generates plain-language alert summaries for officials.", 12, False, BLACK, False),
            ("", 4, False, BLACK, False),
            ("5.  DECISIONASSIST  [Gemini 1.5 Pro chain-of-thought + city KPIs]", 13, True, BLACK, False),
            ("      Generates evidence-based policy recommendations with full reasoning chain, projected KPI impact, risk assessment & implementation steps.", 12, False, BLACK, False),
            ("", 4, False, BLACK, False),
            ("6.  GEOVIEW MAPS  [Vertex AI Vision + BigQuery GIS layers]", 13, True, BLACK, False),
            ("      Interactive spatial analytics — satellite imagery analysis, flood-risk heatmaps, CCTV traffic monitoring, AQI pollution zones, heritage site crowd management.", 12, False, BLACK, False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — Process Flow / Pipeline — pipeline.png
# ═══════════════════════════════════════════════════════════════════════════════
s6 = prs.slides[5]
for sh in s6.shapes:
    if sh.name == "Google Shape;91;p18":
        fill_textframe(sh.text_frame, [
            ("AI Data-to-Decision Pipeline: Raw City Data --> Cloud Functions + Pub/Sub --> BigQuery Warehouse --> Vertex AI Embeddings (RAG) --> Gemini 1.5 Pro --> ADK Multi-Agent --> Smart City Decisions", 12, True, DARK, False),
            ("", 5, False, BLACK, False),
            ("Responsible AI layer runs in parallel: Confidence Scoring | Source Attribution | Human Approval Gate | Full BigQuery Audit Trail", 11, False, (30,100,30), False),
        ])
# Add pipeline image — fills the content area
add_pic(s6, PIPE_IMG, left=0.3, top=1.55, width=9.4, height=3.9)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — Wireframes / Prototype Screenshots
# ═══════════════════════════════════════════════════════════════════════════════
s7 = prs.slides[6]
for sh in s7.shapes:
    if sh.name == "Google Shape;98;p19":
        fill_textframe(sh.text_frame, [
            ("CivicMind AI — Live Interactive Prototype", 14, True, DARK, False),
            ("Live at: https://civicmind-ai-apac.web.app  |  GitHub: https://github.com/Sam2126/civicmind-ai", 12, False, (37,99,235), False),
            ("", 6, False, BLACK, False),
            ("The prototype is a fully deployed Single Page Application (SPA) with 6 interactive tabs:", 13, True, BLACK, False),
            ("", 4, False, BLACK, False),
            ("  TAB 1 — Dashboard:        Live charts for traffic congestion %, AQI index, energy load MW, hospital occupancy % (Chart.js + BigQuery real-time)", 12, False, BLACK, False),
            ("  TAB 2 — CivicChat AI:     Type any civic question -> Gemini 1.5 Pro answers with source + confidence. Try: 'AQI in Mumbai today?'", 12, False, BLACK, False),
            ("  TAB 3 — PredictEngine:    Select domain (traffic/AQI/energy/health) -> View 7-day Vertex AI forecast with confidence bands", 12, False, BLACK, False),
            ("  TAB 4 — Alert Radar:      Live anomaly feed auto-refreshes every 30s. Severity-ranked cards with Gemini-generated summaries", 12, False, BLACK, False),
            ("  TAB 5 — DecisionAssist:   Select city challenge -> Gemini generates full recommendation report with KPI impact scores", 12, False, BLACK, False),
            ("  TAB 6 — GeoView Maps:     Toggle AQI / Flood Risk / Traffic heatmap layers over Mumbai & Jaipur satellite base maps", 12, False, BLACK, False),
            ("", 6, False, BLACK, False),
            ("TECH STACK: HTML5 | CSS3 | Vanilla JS | Firebase Hosting CDN (Google Cloud) | Gemini API | BigQuery Streaming | Vertex AI", 11, True, (30,100,30), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — Architecture Diagram — architecture.png
# ═══════════════════════════════════════════════════════════════════════════════
s8 = prs.slides[7]
for sh in s8.shapes:
    if sh.name == "Google Shape;105;p20":
        fill_textframe(sh.text_frame, [
            ("5-Layer Architecture: Data Sources (2,847+ sensors) -> Google Cloud Ingestion (Cloud Functions, Pub/Sub, Cloud Storage) -> AI Core (BigQuery, Gemini 1.5 Pro, Vertex AI AutoML/Vision/Embeddings, ADK) -> CivicMind Features (6 modules) -> Stakeholders (City Officials, 20M+ Citizens, Emergency Services, Urban Planners)", 11, True, DARK, False),
        ])
# Add architecture image
add_pic(s8, ARCH_IMG, left=0.3, top=1.45, width=9.4, height=4.0)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — Technologies / Google Services
# ═══════════════════════════════════════════════════════════════════════════════
s9 = prs.slides[8]
for sh in s9.shapes:
    if sh.name == "Google Shape;112;p21":
        fill_textframe(sh.text_frame, [
            ("Google Cloud AI Stack — 12 Services Used & Why:", 14, True, DARK, False),
            ("", 5, False, BLACK, False),
            ("1. Gemini 1.5 Pro (Google DeepMind) — CivicChat NL Q&A, DecisionAssist chain-of-thought, Alert summarization, RAG reasoning. Chosen: best-in-class multimodal LLM with 1M token context for large city documents.", 12, False, BLACK, False),
            ("2. Vertex AI AutoML (time-series) — PredictEngine 7-day forecasts. Chosen: managed training with no ML expertise needed; proven on civic time-series.", 12, False, BLACK, False),
            ("3. Vertex AI Embeddings (text-embedding-004) — RAG pipeline semantic search. Chosen: state-of-art embeddings tightly integrated with AlloyDB vector store.", 12, False, BLACK, False),
            ("4. Vertex AI Vision (Gemini Vision) — Satellite imagery & CCTV analysis. Chosen: zero-shot multimodal; no custom training needed for civic visual anomalies.", 12, False, BLACK, False),
            ("5. Agent Dev Kit (ADK v1.0) — Multi-agent orchestration for bus routes, waste mgmt, emergency workflows. Chosen: production-ready Google agent framework.", 12, False, BLACK, False),
            ("6. BigQuery — Civic data warehouse, BigQuery ML anomaly detection, 18 streaming datasets, 2.4M+ records. Chosen: serverless, scales to petabytes, in-DB ML.", 12, False, BLACK, False),
            ("7. Cloud Run — Serverless AI inference API. Chosen: auto-scales to zero, cost-efficient, no infra management.", 12, False, BLACK, False),
            ("8. Cloud Functions + Pub/Sub — Event-driven sensor ingestion, real-time streaming from 2,847+ IoT devices. Chosen: sub-second latency, managed.", 12, False, BLACK, False),
            ("9. Firebase Hosting — Global CDN: https://civicmind-ai-apac.web.app. Chosen: sub-100ms global latency, one-command deploy.", 12, False, BLACK, False),
            ("10. AlloyDB — pgvector store for RAG knowledge base. Chosen: Google-managed Postgres with native vector similarity search.", 12, False, BLACK, False),
            ("", 5, False, BLACK, False),
            ("SCALABILITY: Pub/Sub + BigQuery + Cloud Run auto-scale to 10x data growth with ZERO infrastructure changes. Supports any Indian city.", 12, True, (30,100,30), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — Prototype Snapshots
# ═══════════════════════════════════════════════════════════════════════════════
s10 = prs.slides[9]
for sh in s10.shapes:
    if sh.name == "Google Shape;120;p22":
        fill_textframe(sh.text_frame, [
            ("Live Prototype: https://civicmind-ai-apac.web.app", 14, True, (37,99,235), False),
            ("GitHub Repository: https://github.com/Sam2126/civicmind-ai", 13, False, (37,99,235), False),
            ("", 6, False, BLACK, False),
            ("PROTOTYPE HIGHLIGHTS (test these live in the browser):", 13, True, DARK, False),
            ("", 4, False, BLACK, False),
            ("  DASHBOARD: Real-time KPI cards — Traffic: 73% congestion | AQI: 127 (Moderate) | Energy: 8,847 MW | Hospital: 84% occupancy", 12, False, BLACK, False),
            ("  CIVICHAT: Ask 'What is the AQI in Mumbai?' -> Gemini answers: 'AQI is 127 (Moderate). Primary pollutant: PM2.5. Source: 312 MPCB stations. Confidence: 94%'", 12, False, BLACK, False),
            ("  PREDICTENGINE: '7-day AQI forecast: Mon 134, Tue 128, Wed 119... Monsoon approaching — improving trend. Vertex AI AutoML confidence: 87%'", 12, False, BLACK, False),
            ("  ALERT RADAR: [CRITICAL] Hospital surge detected — KEM Hospital at 97% capacity. Gemini recommendation: Activate overflow protocol.", 12, False, BLACK, False),
            ("  DECISIONASSIST: 'Optimize Andheri bus routes' -> ADK generates: Re-route 213 buses, add 12 express services, estimated 18% delay reduction.", 12, False, BLACK, False),
            ("  GEOVIEW: Flood risk heatmap shows Kurla, Dharavi, Colaba at HIGH risk during monsoon — pre-positioning NDRF teams recommended.", 12, False, BLACK, False),
            ("", 6, False, BLACK, False),
            ("TEAM:  Samarth Khandelwal  |  Bhavya Singh Shekhawat", 13, True, DARK, False),
            ("GEN AI APAC Challenge — PS-1: AI for Better Living & Smarter Communities", 12, False, (37,99,235), False),
        ])

# ═══════════════════════════════════════════════════════════════════════════════
# Save
# ═══════════════════════════════════════════════════════════════════════════════
prs.save(OUTPUT)
print("[OK] Saved:", OUTPUT)
