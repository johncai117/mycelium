import json
import time
import logging
from pathlib import Path
from typing import Optional

import anthropic

from app.models.study_input import StudyInput
from app.models.protocol import Protocol
from app.models.eval_result import JudgeResult, ImprovementSuggestion

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    if path.exists():
        return path.read_text()
    return ""


def _call_with_backoff(fn, max_retries: int = 4):
    """Call fn with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            return fn()
        except anthropic.RateLimitError:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning(f"Rate limited, retrying in {wait}s...")
            time.sleep(wait)
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


class LLMService:
    def __init__(self):
        self.client = anthropic.Anthropic()

    def generate_section(
        self,
        section_name: str,
        study_inputs: StudyInput,
        retrieved_chunks: list[dict],
        system_prompt: str,
        prior_sections: Optional[dict] = None,
    ) -> str:
        chunks_text = "\n\n".join(
            f"[Source: {c.get('source_title', 'Unknown')}]\n{c.get('chunk', '')}"
            for c in retrieved_chunks[:5]
        )
        prior_text = ""
        if prior_sections:
            prior_text = "\n\n".join(
                f"<{k}>\n{v}\n</{k}>" for k, v in prior_sections.items()
            )

        user_message = f"""<study_inputs>
{study_inputs.model_dump_json(indent=2)}
</study_inputs>

<reference_protocols>
{chunks_text or "No reference protocols retrieved."}
</reference_protocols>

{"<prior_sections>" + prior_text + "</prior_sections>" if prior_text else ""}

<instructions>
Generate the {section_name.replace("_", " ").title()} section of the epidemiological study protocol.
Write in formal regulatory language. Do not use bullet points — write flowing paragraphs.
</instructions>"""

        def call():
            message = self.client.messages.create(
                model=MODEL,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text

        return _call_with_backoff(call)

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

        def call():
            message = self.client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text

        raw = _call_with_backoff(call)
        # Strip markdown code fences if present
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

        def call():
            message = self.client.messages.create(
                model=MODEL,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text

        raw = _call_with_backoff(call)
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

        def call():
            message = self.client.messages.create(
                model=MODEL,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text

        return _call_with_backoff(call)
