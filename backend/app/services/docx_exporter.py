import io
from datetime import datetime

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.models.protocol import Protocol

SECTION_ORDER = [
    "background",
    "objectives",
    "study_design",
    "study_setting",
    "cohort_definition",
    "variables",
    "study_size",
    "data_analysis",
    "limitations",
    "ethics",
]

SECTION_TITLES = {
    "background": "1. Background and Rationale",
    "objectives": "2. Study Objectives",
    "study_design": "3. Study Design",
    "study_setting": "4. Study Setting and Data Source",
    "cohort_definition": "5. Study Population and Cohort Definition",
    "variables": "6. Variables: Exposures, Outcomes, and Covariates",
    "study_size": "7. Study Size",
    "data_analysis": "8. Data Analysis",
    "limitations": "9. Limitations",
    "ethics": "10. Ethical Considerations",
}


def generate_docx(protocol: Protocol) -> bytes:
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1.25)

    # ── Regulatory Header Block ──────────────────────────────────────
    title = protocol.study_inputs.drug_name
    if protocol.study_inputs.indication:
        title += f" — {protocol.study_inputs.indication}"

    heading = doc.add_heading(title, level=0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("")

    header_data = [
        ("Protocol Title", title),
        ("Drug Name (INN)", protocol.study_inputs.drug_inn or protocol.study_inputs.drug_name),
        ("Indication", protocol.study_inputs.indication),
        ("Study Type", protocol.study_inputs.study_type.replace("_", " ").title()),
        ("Sponsor", protocol.study_inputs.sponsor or "Not specified"),
        ("Regulatory Context", (protocol.study_inputs.regulatory_context or "Not specified").replace("_", " ").title()),
        ("Protocol Version", str(protocol.version)),
        ("Date", datetime.utcnow().strftime("%d %B %Y")),
        ("Study ID", protocol.study_id),
    ]

    table = doc.add_table(rows=len(header_data), cols=2)
    table.style = "Table Grid"
    for i, (label, value) in enumerate(header_data):
        table.cell(i, 0).text = label
        table.cell(i, 1).text = value
        table.cell(i, 0).paragraphs[0].runs[0].bold = True

    doc.add_paragraph("")
    doc.add_paragraph("─" * 80)
    doc.add_paragraph("")

    # ── Protocol Sections ────────────────────────────────────────────
    for section_key in SECTION_ORDER:
        section = protocol.sections.get(section_key)
        title_text = SECTION_TITLES.get(section_key, section_key.replace("_", " ").title())

        doc.add_heading(title_text, level=1)

        if section:
            for para_text in section.content.split("\n\n"):
                para_text = para_text.strip()
                if para_text:
                    doc.add_paragraph(para_text)
        else:
            p = doc.add_paragraph("[Section not yet generated]")
            p.runs[0].italic = True

        doc.add_paragraph("")

    # ── Code Sets Tables ─────────────────────────────────────────────
    doc.add_heading("Appendix A: Code Sets", level=1)

    if protocol.code_sets.icd10:
        doc.add_heading("A.1 ICD-10 Diagnosis Codes", level=2)
        t = doc.add_table(rows=1, cols=3)
        t.style = "Table Grid"
        hdr = t.rows[0].cells
        hdr[0].text, hdr[1].text, hdr[2].text = "Code", "Description", "Source"
        for item in protocol.code_sets.icd10:
            row = t.add_row().cells
            row[0].text = item.get("code", "")
            row[1].text = item.get("description", "")
            row[2].text = item.get("source", "ICD-10-CM")
        doc.add_paragraph("")

    if protocol.code_sets.ndc:
        doc.add_heading("A.2 NDC / Drug Codes", level=2)
        t = doc.add_table(rows=1, cols=3)
        t.style = "Table Grid"
        hdr = t.rows[0].cells
        hdr[0].text, hdr[1].text, hdr[2].text = "Code", "Description", "Source"
        for item in protocol.code_sets.ndc:
            row = t.add_row().cells
            row[0].text = item.get("code", "")
            row[1].text = item.get("description", "")
            row[2].text = item.get("source", "NDC")
        doc.add_paragraph("")

    if protocol.code_sets.cpt:
        doc.add_heading("A.3 CPT Procedure Codes", level=2)
        t = doc.add_table(rows=1, cols=3)
        t.style = "Table Grid"
        hdr = t.rows[0].cells
        hdr[0].text, hdr[1].text, hdr[2].text = "Code", "Description", "Source"
        for item in protocol.code_sets.cpt:
            row = t.add_row().cells
            row[0].text = item.get("code", "")
            row[1].text = item.get("description", "")
            row[2].text = item.get("source", "CPT")

    # Serialize to bytes
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()
