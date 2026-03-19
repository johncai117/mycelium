import json
import time
import logging
import urllib.request
from pathlib import Path
from typing import Optional

from app.models.study_input import StudyInput
from app.models.protocol import Protocol
from app.models.eval_result import JudgeResult, ImprovementSuggestion
from app.models.methodology import METHODOLOGY_REGISTRY, MethodologyCategory

logger = logging.getLogger(__name__)

MODEL = "qwen3.5:9b"
OLLAMA_BASE_URL = "http://localhost:11434"
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    if path.exists():
        return path.read_text()
    return ""


def _call_with_backoff(fn, max_retries: int = 3):
    """Call fn with simple retry on transient errors."""
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning(f"LLM call failed ({e}), retrying in {wait}s...")
            time.sleep(wait)


class LLMService:
    def __init__(self):
        self.base_url = OLLAMA_BASE_URL

    def _chat(self, system: str, user: str, max_tokens: int = 2048) -> str:
        """Call Ollama native API with think=false to get direct output."""
        def call():
            payload = json.dumps({
                "model": MODEL,
                "think": False,
                "stream": False,
                "options": {"num_predict": max_tokens},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            }).encode("utf-8")

            req = urllib.request.Request(
                f"{self.base_url}/api/chat",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                return data["message"]["content"]

        return _call_with_backoff(call)

    def generate_section(
        self,
        section_name: str,
        study_inputs: StudyInput,
        retrieved_chunks: list[dict],
        system_prompt: str,
        prior_sections: Optional[dict] = None,
        section_display_label: Optional[str] = None,
        regulatory_context: Optional[str] = None,
    ) -> str:
        if regulatory_context:
            system_prompt = system_prompt + f"\n\n{regulatory_context}"

        chunks_text = "\n\n".join(
            f"[Source: {c.get('source_title', 'Unknown')}]\n{c.get('chunk', '')}"
            for c in retrieved_chunks[:5]
        )
        prior_text = ""
        if prior_sections:
            prior_text = "\n\n".join(
                f"<{k}>\n{v}\n</{k}>" for k, v in prior_sections.items()
            )

        methodology_context = ""
        if study_inputs.methodology:
            try:
                cat = MethodologyCategory(study_inputs.methodology)
                profile = METHODOLOGY_REGISTRY[cat]
                methodology_context = f"""
<methodology_context>
<methodology_name>{profile.display_name}</methodology_name>
<methodology_description>{profile.description}</methodology_description>
<key_assumptions>{profile.key_assumptions}</key_assumptions>
<typical_analysis>{profile.typical_analysis}</typical_analysis>
<confounding_approach>{profile.confounding_approach}</confounding_approach>
</methodology_context>"""
            except (ValueError, KeyError):
                pass

        label = section_display_label or section_name.replace("_", " ").title()

        user_message = f"""<study_inputs>
{study_inputs.model_dump_json(indent=2)}
</study_inputs>
{methodology_context}
<reference_protocols>
{chunks_text or "No reference protocols retrieved."}
</reference_protocols>

{"<prior_sections>" + prior_text + "</prior_sections>" if prior_text else ""}

<instructions>
Generate the {label} section of the epidemiological study protocol.
Write in formal regulatory language. Do not use bullet points — write flowing paragraphs.
</instructions>"""

        return self._chat(system_prompt, user_message, max_tokens=2048)

    def clarify_inputs(self, study_inputs: StudyInput) -> list[dict]:
        system_prompt = _load_prompt("clarify")
        user_message = f"""<study_inputs>
{study_inputs.model_dump_json(indent=2)}
</study_inputs>

<instructions>
Assess whether these study inputs are sufficient to generate a high-quality regulatory protocol.
Return a JSON array of clarifying questions for any gaps. Each question must have:
- field: the StudyInput field name
- question: the question text
- why_it_matters: brief explanation
- options: list of string options or null
- required: true/false

Return ONLY valid JSON array, no other text.
</instructions>"""

        raw = self._chat(system_prompt, user_message, max_tokens=1024)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    def judge_protocol(self, protocol: Protocol) -> JudgeResult:
        system_prompt = _load_prompt("judge")
        sections_text = "\n\n".join(
            f"## {name.replace('_', ' ').title()}\n{section.content}"
            for name, section in protocol.sections.items()
        )
        user_message = f"""<study_inputs>
{protocol.study_inputs.model_dump_json(indent=2)}
</study_inputs>

<protocol_sections>
{sections_text}
</protocol_sections>

<instructions>
Evaluate this protocol against ENCEPP checklist standards.
Return a JSON object with:
- narrative: overall qualitative assessment (2-3 paragraphs)
- improvement_suggestions: array of {{section, suggestion}} objects

Return ONLY valid JSON, no other text.
</instructions>"""

        raw = self._chat(system_prompt, user_message, max_tokens=2048)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        return JudgeResult(
            narrative=data.get("narrative", ""),
            improvement_suggestions=[
                ImprovementSuggestion(**s) for s in data.get("improvement_suggestions", [])
            ],
        )

    def extract_regulatory_doc(self, document_text: str) -> dict:
        """Extract structured regulatory information from a PMR/PASS document."""
        system_prompt = (
            "You are a regulatory affairs expert specializing in FDA Post-Marketing Requirements "
            "(PMR/PMC) and EMA Post-Authorization Safety Studies (PASS). "
            "Extract structured information from regulatory documents accurately and concisely."
        )

        user_message = f"""<document>
{document_text}
</document>

<instructions>
Extract the following fields from this regulatory document (FDA PMR letter, EMA PASS obligation, or RMP extract).

Return a JSON object with ONLY these keys:
- study_description: verbatim or near-verbatim requirement text (1-3 sentences)
- requirement_type: one of "FDA PMR 505(o)", "FDA PMR PREA", "FDA PMR CVOT", "FDA PMC 506B", "EMA PASS Category 1", "EMA PASS Category 3", or best match string
- milestones: array of {{name, date}} objects — names should be "Draft Protocol", "Final Protocol", "Study Completion", "Final Report"; use null for date if not found
- safety_signal: the specific safety concern (e.g. "medullary thyroid carcinoma", "MACE", "pancreatitis")
- scientific_justification: 1-2 sentences on why the study is required
- application_number: BLA/NDA/MAA/EU application number (e.g. "BLA 125469")
- applicant_name: sponsor/applicant company name

Return ONLY valid JSON, no markdown fences, no other text.
</instructions>"""

        raw = self._chat(system_prompt, user_message, max_tokens=1024)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    def regenerate_section(
        self,
        section_id: str,
        current_content: str,
        researcher_comment: str,
        study_inputs: StudyInput,
        retrieved_chunks: list[dict],
    ) -> str:
        system_prompt = _load_prompt(f"section_{section_id}") or _load_prompt("section_background")
        chunks_text = "\n\n".join(
            f"[Source: {c.get('source_title', 'Unknown')}]\n{c.get('chunk', '')}"
            for c in retrieved_chunks[:5]
        )
        user_message = f"""<study_inputs>
{study_inputs.model_dump_json(indent=2)}
</study_inputs>

<current_draft>
{current_content}
</current_draft>

<researcher_comment>
{researcher_comment}
</researcher_comment>

<reference_protocols>
{chunks_text or "No reference protocols retrieved."}
</reference_protocols>

<instructions>
Revise the {section_id.replace("_", " ").title()} section based on the researcher's comment above.
Preserve what was good in the current draft. Address the specific feedback.
Write in formal regulatory language. Do not use bullet points — write flowing paragraphs.
</instructions>"""

        return self._chat(system_prompt, user_message, max_tokens=2048)
