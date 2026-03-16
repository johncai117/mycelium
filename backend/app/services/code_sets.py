import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "code_sets"


class CodeSetService:
    def __init__(self):
        self._icd10: dict = {}
        self._ndc: dict = {}
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        try:
            icd_path = DATA_DIR / "icd10_by_condition.json"
            ndc_path = DATA_DIR / "ndc_by_drug.json"
            if icd_path.exists():
                self._icd10 = json.loads(icd_path.read_text())
            if ndc_path.exists():
                self._ndc = json.loads(ndc_path.read_text())
            self._loaded = True
        except Exception as e:
            logger.error(f"Failed to load code sets: {e}")

    def lookup(self, condition_or_drug: str) -> dict:
        self._load()
        key = condition_or_drug.lower().replace(" ", "_").replace("-", "_")

        icd10_codes = []
        ndc_codes = []

        # Search ICD-10
        for condition_key, data in self._icd10.items():
            if key in condition_key or condition_key in key:
                icd10_codes.extend(data.get("codes", []))

        # Search NDC
        for drug_key, data in self._ndc.items():
            if key in drug_key or drug_key in key:
                ndc_codes.extend(data.get("codes", []))

        return {
            "icd10": icd10_codes,
            "ndc": ndc_codes,
            "cpt": [],  # CPT lookup reserved for future integration
        }

    def lookup_condition(self, condition: str) -> list[dict]:
        self._load()
        key = condition.lower().replace(" ", "_").replace("-", "_")
        for condition_key, data in self._icd10.items():
            if key in condition_key or condition_key in key:
                return data.get("codes", [])
        return []

    def lookup_drug(self, drug: str) -> list[dict]:
        self._load()
        key = drug.lower().replace(" ", "_").replace("-", "_")
        for drug_key, data in self._ndc.items():
            if key in drug_key or drug_key in key:
                return data.get("codes", [])
        return []

    def all_conditions(self) -> list[str]:
        self._load()
        return list(self._icd10.keys())

    def all_drugs(self) -> list[str]:
        self._load()
        return list(self._ndc.keys())
