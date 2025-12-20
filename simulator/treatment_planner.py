from typing import Dict, List
import random


class TreatmentPlanner:
    DIAGNOSIS_TREATMENTS: Dict[str, List[str]] = {
        "Hypertension": [
            "Monitor blood pressure every 4 hours",
            "Administer antihypertensive medication",
            "Check for side effects",
            "Dietary consultation",
        ],
        "Diabetes Type 2": [
            "Check blood glucose levels",
            "Administer insulin",
            "Monitor for hypoglycemia",
            "Dietary review",
            "Foot examination",
        ],
        "Pneumonia": [
            "Administer antibiotics",
            "Monitor oxygen saturation",
            "Chest X-ray follow-up",
            "Respiratory therapy",
            "Check temperature every 4 hours",
        ],
        "Fractured Leg": [
            "X-ray examination",
            "Apply cast",
            "Pain management",
            "Physical therapy consultation",
            "Check circulation",
        ],
        "Appendicitis": [
            "Prepare for surgery",
            "Pre-operative assessment",
            "Post-operative monitoring",
            "Pain medication",
            "Wound care",
        ],
        "Heart Attack": [
            "ECG monitoring",
            "Administer cardiac medications",
            "Monitor vital signs continuously",
            "Cardiac rehabilitation",
            "Dietary restrictions",
        ],
        "Stroke": [
            "Neurological assessment",
            "Monitor blood pressure",
            "Speech therapy",
            "Physical therapy",
            "Occupational therapy",
        ],
        "Asthma": [
            "Administer bronchodilator",
            "Monitor peak flow",
            "Oxygen therapy if needed",
            "Check respiratory rate",
        ],
        "Kidney Infection": [
            "Administer antibiotics",
            "Monitor fluid intake/output",
            "Check temperature",
            "Urine analysis",
        ],
        "Migraine": [
            "Administer pain medication",
            "Dark room rest",
            "Monitor symptoms",
            "Hydration check",
        ],
    }

    DIAGNOSES = list(DIAGNOSIS_TREATMENTS.keys())

    @staticmethod
    def get_random_diagnosis() -> str:
        return random.choice(TreatmentPlanner.DIAGNOSES)

    @staticmethod
    def get_treatments_for_diagnosis(diagnosis: str) -> List[str]:
        treatments = TreatmentPlanner.DIAGNOSIS_TREATMENTS.get(
            diagnosis, ["General patient care", "Monitor vital signs"]
        )
        num_treatments = random.randint(2, min(4, len(treatments)))
        return random.sample(treatments, num_treatments)

    @staticmethod
    def get_urgency_for_diagnosis(diagnosis: str) -> str:
        urgent = [
            "Heart Attack",
            "Stroke",
            "Appendicitis",
            "Pneumonia",
        ]
        if diagnosis in urgent:
            return "URGENT"
        return "NORMAL"
