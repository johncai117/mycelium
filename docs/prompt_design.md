# Prompt Engineering Decisions

This document explains the rationale behind key prompt design choices in Mycelium.

---

## Model

All generation uses `claude-sonnet-4-6` via the Anthropic Python SDK.

**Why this model:**
- Excels at long structured document generation with consistent formatting
- Strong understanding of regulatory/scientific writing conventions
- Large context window handles full study inputs + reference chunks

---

## Structural Pattern: XML Tags

All prompts use XML tags to clearly delimit input sections to Claude:

```
<study_inputs>
  { ...JSON of StudyInput }
</study_inputs>

<reference_protocols>
  [Source: EUPAS12345 - Tofacitinib RA PASS]
  Text from similar protocol...
</reference_protocols>

<prior_sections>
  <background>
    Previously generated background text...
  </background>
</prior_sections>

<instructions>
  Generate the cohort definition section...
</instructions>
```

**Why XML tags:**
- Claude processes tagged inputs more reliably than free-form text
- Prevents prompt injection from reference protocol content
- Makes clear separation between data and instructions

---

## Section-by-Section Generation

Each of the 10 sections is generated with a separate LLM call rather than generating the full protocol in one pass.

**Why:**
1. **Regeneration**: Researcher can regenerate one section without re-generating everything
2. **Context accumulation**: Later sections receive summaries of earlier sections as context
3. **Quality**: Each section's prompt can be tuned independently
4. **Cost control**: Failed calls or interruptions don't waste all previous work

**Context passing:** When generating sections 2–10, the first 500 characters of each prior section are passed as context. This maintains thematic consistency without exceeding context limits.

---

## Section Prompts

Each prompt in `backend/app/prompts/section_*.md` includes:

1. **Role definition**: "You are an expert pharmacoepidemiologist..."
2. **Required content**: Numbered list of what the section must cover
3. **Writing guidelines**: Tone, length, format, regulatory language expectations
4. **Regulatory alignment**: Reference to ENCePP, EMA PASS guidelines, or ICH E6

### Confidence levels
Sections get confidence levels based on input completeness:
- `high`: Key input fields (index_date, data_source) are provided
- `medium`: Primary outcome or clinical context provided
- `low`: Sparse inputs — requires more epidemiologist judgment

---

## Clarify Prompt

The clarify endpoint uses **deterministic rule-based logic** rather than an LLM for the primary decision. This ensures:
- Consistent behavior without API calls
- Fast response (no LLM latency on form step 3→4 transition)
- Predictable frontend behavior

An LLM option is available in `llm.py::clarify_inputs()` for cases where more nuanced assessment is needed.

---

## Judge Prompt

The LLM judge (`backend/app/prompts/judge.md`) is calibrated against EMA PASS standards:
- **A grade (90+)**: Approvable without major revision
- **B grade (80–89)**: Minor clarifications needed
- **C grade (70–79)**: One or more sections need substantial revision
- **D grade (<70)**: Fundamental design or documentation gaps

The judge returns structured JSON with:
- `narrative`: 2–3 paragraph qualitative assessment
- `improvement_suggestions`: Max 8 specific, actionable items

---

## Regeneration Loop

When a researcher requests section regeneration:
1. Current section content is passed as `<current_draft>`
2. Researcher's feedback is passed as `<researcher_comment>`
3. The section-specific system prompt is used
4. A change summary is auto-generated (word count delta)
5. A diff view is shown in the UI

**Why not fine-tuning:** The system relies on prompting + context rather than fine-tuning. This allows:
- Protocol-specific customization without retraining
- Easy prompt iteration
- No training data requirements

---

## Common Anti-Patterns to Avoid

1. **Full protocol in one call**: Hard to regenerate individual sections, context overload
2. **Generic prompts**: "Write a methods section" produces boilerplate, not study-specific content
3. **No reference context**: Without retrieved similar protocols, outputs lack domain-specific patterns
4. **Unconstrained format**: Bullet points appear without explicit `flowing paragraphs` instruction
5. **Missing domain guardrails**: Without explicit "don't make causal claims" guidance, outputs may be overly assertive

---

## Future Work

- **Streaming**: Use streaming API to show generation progress in real-time
- **Tool use**: Implement `search_pubmed`, `lookup_code_set`, `causal_method_decision_tree` tools
- **Few-shot examples**: Inject 1–2 approved protocol excerpts directly into section prompts
- **Confidence calibration**: Track correlation between `confidence` field and human reviewer scores
- **Prompt versioning**: Version prompts in git; track which prompt version generated each section
