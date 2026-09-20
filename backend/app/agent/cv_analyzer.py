"""
CV Analyzer Agent:
Extracts text from uploaded PDF / DOCX / TXT files and performs deep AI analysis
to produce a structured CVReport for recruiters.

Scoring dimensions (weights):
  - Technical Skills    25%
  - Work Experience     25%
  - Projects/Portfolio  20%
  - Education           15%
  - Communication/Format 10%
  - Leadership/Culture   5%

Two modes:
  - LLM (OpenAI configured): Full GPT-4o-mini semantic analysis
  - Heuristic fallback: keyword density + section detection
"""
from __future__ import annotations

import io
import json
import re
from typing import Any, Dict, List, Optional, Tuple


# ── Text extraction helpers ────────────────────────────────────────────────

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT bytes."""
    name_lower = filename.lower()

    # PDF
    if name_lower.endswith(".pdf"):
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages.append(t)
            return "\n".join(pages)
        except Exception as e:
            print(f"PDF extraction error: {e}")

    # DOCX
    if name_lower.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            print(f"DOCX extraction error: {e}")

    # Plain text / markdown / fallback
    try:
        return file_bytes.decode("utf-8", errors="replace")
    except Exception:
        return ""


# ── Heuristic analyser (no-LLM fallback) ──────────────────────────────────

_TECH_KEYWORDS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "kotlin",
    "react", "vue", "angular", "node", "fastapi", "django", "flask", "spring",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "git",
    "machine learning", "deep learning", "pytorch", "tensorflow", "scikit",
    "rest", "graphql", "microservices", "api", "backend", "frontend", "fullstack",
]

_EXPERIENCE_KEYWORDS = [
    "engineer", "developer", "architect", "lead", "senior", "intern", "manager",
    "worked", "developed", "built", "designed", "implemented", "improved",
    "reduced", "increased", "deployed", "maintained", "collaborated",
    "years", "months", "experience",
]

_EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "b.sc", "m.sc", "b.tech", "m.tech", "degree",
    "university", "college", "institute", "gpa", "cgpa", "honors", "distinction",
]

_PROJECT_KEYWORDS = [
    "project", "github", "open source", "built", "created", "launched", "published",
    "portfolio", "app", "website", "platform", "system", "tool", "library",
]

_LEADERSHIP_KEYWORDS = [
    "led", "mentored", "managed", "team", "leader", "organized", "founded",
    "speaker", "hackathon", "volunteer", "community", "club", "president",
]


def _keyword_density(text: str, keywords: List[str]) -> float:
    text_lower = text.lower()
    matched = sum(1 for kw in keywords if kw in text_lower)
    return matched / len(keywords)


def _detect_sections(text: str) -> Dict[str, bool]:
    text_lower = text.lower()
    return {
        "experience":  bool(re.search(r'\b(experience|work history|employment)\b', text_lower)),
        "education":   bool(re.search(r'\b(education|academic|degree|university|college)\b', text_lower)),
        "skills":      bool(re.search(r'\b(skills|technologies|tools|tech stack)\b', text_lower)),
        "projects":    bool(re.search(r'\b(projects|portfolio|github|open source)\b', text_lower)),
        "contact":     bool(re.search(r'\b(email|phone|linkedin|github\.com|@)\b', text_lower)),
        "summary":     bool(re.search(r'\b(summary|objective|about|profile)\b', text_lower)),
    }


def _extract_years_experience(text: str) -> str:
    m = re.search(r'(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)', text, re.IGNORECASE)
    if m:
        return f"{m.group(1)}+ years"
    # Count date ranges like "2020 - 2023"
    ranges = re.findall(r'(20\d\d|19\d\d)\s*[-–]\s*(20\d\d|present|current)', text, re.IGNORECASE)
    if ranges:
        return f"~{len(ranges)} roles detected"
    return "Not specified"


def _extract_skills_list(text: str) -> List[str]:
    text_lower = text.lower()
    found = [kw.title() for kw in _TECH_KEYWORDS if kw in text_lower]
    return found[:20]  # cap at 20


def _heuristic_analyze(text: str, filename: str, candidate_id: str, cv_id: str, created_at: str) -> dict:
    sections = _detect_sections(text)

    tech_density   = _keyword_density(text, _TECH_KEYWORDS)
    exp_density    = _keyword_density(text, _EXPERIENCE_KEYWORDS)
    proj_density   = _keyword_density(text, _PROJECT_KEYWORDS)
    edu_density    = _keyword_density(text, _EDUCATION_KEYWORDS)
    leader_density = _keyword_density(text, _LEADERSHIP_KEYWORDS)

    word_count = len(text.split())
    format_score = min(100, int(
        (sections["contact"] * 15) +
        (sections["summary"] * 10) +
        (min(word_count, 800) / 800 * 50) +
        (25 if 300 < word_count < 1200 else 10)
    ))

    tech_score   = min(100, int(tech_density * 300))
    exp_score    = min(100, int(exp_density * 350 + (40 if sections["experience"] else 0)))
    proj_score   = min(100, int(proj_density * 400 + (20 if sections["projects"] else 0)))
    edu_score    = min(100, int(edu_density * 400 + (30 if sections["education"] else 0)))
    leader_score = min(100, int(leader_density * 500))

    # Weighted composite
    cv_score = int(
        tech_score   * 0.25 +
        exp_score    * 0.25 +
        proj_score   * 0.20 +
        edu_score    * 0.15 +
        format_score * 0.10 +
        leader_score * 0.05
    )
    cv_score = max(10, min(100, cv_score))

    strengths = []
    gaps = []

    if tech_score >= 60:
        strengths.append(f"Strong technical keyword presence ({tech_score}/100)")
    else:
        gaps.append("Limited technical skills visibility — list specific technologies explicitly")

    if exp_score >= 60:
        strengths.append(f"Clear work experience signals ({exp_score}/100)")
    else:
        gaps.append("Work experience section is weak or missing impact statements")

    if proj_score >= 50:
        strengths.append("Projects or portfolio references detected")
    else:
        gaps.append("No project or GitHub portfolio references found")

    if edu_score >= 50:
        strengths.append("Education section present and structured")
    else:
        gaps.append("Education section is missing or under-specified")

    if format_score >= 60:
        strengths.append("CV length and structure appear appropriate")
    else:
        gaps.append("CV may be too short, too long, or missing key sections")

    recruiter_notes = (
        f"Heuristic analysis (no AI key configured). CV Score: {cv_score}/100. "
        f"Sections detected: {', '.join(k for k,v in sections.items() if v) or 'None'}. "
        f"Top skills: {', '.join(_extract_skills_list(text)[:8]) or 'None detected'}. "
        f"{'Candidate shows strong technical background.' if cv_score >= 70 else 'Candidate CV needs improvement in key areas.'}"
    )

    return {
        "cv_id": cv_id,
        "candidate_id": candidate_id,
        "filename": filename,
        "cv_score": cv_score,
        "percentile": 50,  # computed dynamically after storing
        "dimensions": [
            {"name": "Technical Skills",     "score": tech_score,   "weight": 0.25, "notes": f"{len(_extract_skills_list(text))} technologies detected"},
            {"name": "Work Experience",      "score": exp_score,    "weight": 0.25, "notes": _extract_years_experience(text)},
            {"name": "Projects & Portfolio", "score": proj_score,   "weight": 0.20, "notes": "GitHub/portfolio links detected" if "github" in text.lower() else "No portfolio links found"},
            {"name": "Education",            "score": edu_score,    "weight": 0.15, "notes": "Degree/institution found" if sections["education"] else "Education section missing"},
            {"name": "Communication/Format", "score": format_score, "weight": 0.10, "notes": f"{word_count} words, structure {'good' if format_score >= 60 else 'needs work'}"},
            {"name": "Leadership/Culture",   "score": leader_score, "weight": 0.05, "notes": "Leadership signals detected" if leader_score >= 40 else "No leadership signals"},
        ],
        "strengths": strengths,
        "gaps": gaps,
        "recruiter_notes": recruiter_notes,
        "extracted_skills": _extract_skills_list(text),
        "years_of_experience": _extract_years_experience(text),
        "education_summary": "See CV" if sections["education"] else "Not specified",
        "created_at": created_at,
    }


# ── LLM-powered analyser ───────────────────────────────────────────────────

async def _llm_analyze(text: str, filename: str, candidate_id: str, cv_id: str, created_at: str, settings) -> Optional[dict]:
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        # Truncate very long CVs to ~4000 chars to stay within token budget
        cv_text = text[:4000] if len(text) > 4000 else text

        prompt = f"""You are an expert technical recruiter and HR analyst evaluating a candidate's CV/Resume.

CV Content:
\"\"\"
{cv_text}
\"\"\"

Evaluate this CV across 6 dimensions and return a comprehensive recruiter report.

Score each dimension from 0-100:
1. Technical Skills (weight 25%) — programming languages, frameworks, tools, cloud, databases
2. Work Experience (weight 25%) — relevance, seniority level, impact/achievement statements, tenure
3. Projects & Portfolio (weight 20%) — real-world projects, GitHub, open source, measurable outcomes
4. Education (weight 15%) — degree level, institution quality, GPA/rankings, relevant coursework
5. Communication & Format (weight 10%) — clarity, structure, grammar, appropriate length, ATS-friendly
6. Leadership & Culture (weight 5%) — team lead, mentoring, open source contributions, speaking, awards

Compute: cv_score = (tech*0.25) + (exp*0.25) + (proj*0.20) + (edu*0.15) + (comm*0.10) + (leader*0.05)

Return ONLY valid JSON:
{{
  "cv_score": <integer 0-100>,
  "dimensions": [
    {{"name": "Technical Skills",     "score": <int>, "weight": 0.25, "notes": "<specific observation>"}},
    {{"name": "Work Experience",      "score": <int>, "weight": 0.25, "notes": "<specific observation>"}},
    {{"name": "Projects & Portfolio", "score": <int>, "weight": 0.20, "notes": "<specific observation>"}},
    {{"name": "Education",            "score": <int>, "weight": 0.15, "notes": "<specific observation>"}},
    {{"name": "Communication/Format", "score": <int>, "weight": 0.10, "notes": "<specific observation>"}},
    {{"name": "Leadership/Culture",   "score": <int>, "weight": 0.05, "notes": "<specific observation>"}}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "recruiter_notes": "<2-3 sentence actionable hiring summary for the hiring manager>",
  "extracted_skills": ["<skill1>", "<skill2>", ...],
  "years_of_experience": "<e.g. '3+ years' or 'Entry level'>",
  "education_summary": "<e.g. 'B.Tech Computer Science, IIT Delhi 2022'>"
}}"""

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are BugStriker's CV analysis engine. Output valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            return None

        parsed = json.loads(content)
        cv_score = max(0, min(100, int(parsed.get("cv_score", 50))))

        return {
            "cv_id": cv_id,
            "candidate_id": candidate_id,
            "filename": filename,
            "cv_score": cv_score,
            "percentile": 50,
            "dimensions": parsed.get("dimensions", []),
            "strengths": parsed.get("strengths", []),
            "gaps": parsed.get("gaps", []),
            "recruiter_notes": parsed.get("recruiter_notes", ""),
            "extracted_skills": parsed.get("extracted_skills", []),
            "years_of_experience": parsed.get("years_of_experience", "Not specified"),
            "education_summary": parsed.get("education_summary", "Not specified"),
            "created_at": created_at,
        }
    except Exception as e:
        print(f"CV Analyzer LLM error: {e}")
        return None


# ── Public API ─────────────────────────────────────────────────────────────

async def analyze_cv(
    file_bytes: bytes,
    filename: str,
    candidate_id: str,
    cv_id: str,
    created_at: str,
) -> dict:
    """
    Main entry point. Extracts text from the uploaded file,
    then runs LLM analysis (or heuristic fallback).
    Returns a raw dict that maps to CVReport.
    """
    from app.config import get_settings
    settings = get_settings()

    text = extract_text_from_bytes(file_bytes, filename)
    if not text.strip():
        # Empty file — return minimal report
        return {
            "cv_id": cv_id,
            "candidate_id": candidate_id,
            "filename": filename,
            "cv_score": 0,
            "percentile": 0,
            "dimensions": [],
            "strengths": [],
            "gaps": ["Could not extract text from the uploaded file. Please upload a readable PDF or DOCX."],
            "recruiter_notes": "File could not be parsed. Candidate should re-upload.",
            "extracted_skills": [],
            "years_of_experience": "Unknown",
            "education_summary": "Unknown",
            "created_at": created_at,
        }

    use_llm = bool(
        settings.openai_api_key
        and not settings.openai_api_key.startswith("sk-...")
        and not settings.openai_api_key.startswith("sk-placeholder")
    )

    if use_llm:
        result = await _llm_analyze(text, filename, candidate_id, cv_id, created_at, settings)
        if result:
            return result

    return _heuristic_analyze(text, filename, candidate_id, cv_id, created_at)
