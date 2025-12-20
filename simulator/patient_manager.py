from typing import List, Optional, Tuple
from graphql_client import GraphQLClient
from config import logger
from data import RandomDataGenerator
from location_manager import LocationManager
from treatment_planner import TreatmentPlanner
import random


class PatientManager:
    def __init__(self, client: GraphQLClient, location_manager: LocationManager):
        self.client = client
        self.location_manager = location_manager
        self.patient_ids: List[str] = []
        self.diagnosis_property_id: Optional[str] = None

    def _log_errors(self, context: str, response: dict) -> None:
        if "errors" in response:
            logger.error(f"Error in {context}: {response['errors']}")

    def load_patients(self) -> None:
        query = """
            query LoadPatients {
                patients {
                    id
                    state
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")

        if not data:
            self._log_errors("load_patients", response)
            return

        self.patient_ids = [p["id"] for p in data.get("patients", [])]
        logger.info(f"Loaded {len(self.patient_ids)} patients")

    def ensure_diagnosis_property(self) -> None:
        if self.diagnosis_property_id:
            return

        query = """
            query GetPropertyDefinitions {
                propertyDefinitions {
                    id
                    name
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")

        if data:
            for prop in data.get("propertyDefinitions", []):
                if prop["name"] == "Diagnosis":
                    self.diagnosis_property_id = prop["id"]
                    logger.debug("Found existing Diagnosis property")
                    return

        mutation = """
            mutation CreatePropertyDefinition($data: CreatePropertyDefinitionInput!) {
                createPropertyDefinition(data: $data) {
                    id
                    name
                }
            }
        """
        variables = {
            "data": {
                "name": "Diagnosis",
                "fieldType": "FIELD_TYPE_TEXT",
                "allowedEntities": ["PATIENT"],
                "description": "Patient diagnosis",
                "isActive": True,
            }
        }

        response = self.client.query(mutation, variables)
        data = response.get("data")

        if data and data.get("createPropertyDefinition"):
            self.diagnosis_property_id = data["createPropertyDefinition"]["id"]
            logger.info("Created Diagnosis property definition")
        else:
            self._log_errors("ensure_diagnosis_property", response)

    def create_patient(self, admit_directly: bool = False) -> Tuple[Optional[str], Optional[str]]:
        if not self.location_manager.clinics:
            logger.warning("No clinics available to assign patient")
            return None, None

        first, last = RandomDataGenerator.get_name()
        diagnosis = TreatmentPlanner.get_random_diagnosis()
        clinic_id = random.choice(self.location_manager.clinics)

        state = "ADMITTED" if admit_directly else "WAIT"
        location_ids = []

        if admit_directly:
            location = self.location_manager.get_random_location()
            if location:
                location_ids = [location]

        mutation = """
            mutation CreatePatient($firstname: String!, $lastname: String!, $birthdate: Date!,
                                 $sex: Sex!, $clinicId: ID!, $state: PatientState,
                                 $locationIds: [ID!]) {
                createPatient(data: {
                    firstname: $firstname,
                    lastname: $lastname,
                    birthdate: $birthdate,
                    sex: $sex,
                    clinicId: $clinicId,
                    state: $state,
                    assignedLocationIds: $locationIds
                }) {
                    id
                    name
                    state
                    assignedLocations {
                        id
                        title
                    }
                }
            }
        """
        variables = {
            "firstname": first,
            "lastname": last,
            "birthdate": RandomDataGenerator.get_birthdate(),
            "sex": RandomDataGenerator.get_sex(),
            "clinicId": clinic_id,
            "state": state,
            "locationIds": location_ids,
        }

        response = self.client.query(mutation, variables)
        data = response.get("data")

        if data and data.get("createPatient"):
            patient = data["createPatient"]
            pid = patient["id"]
            self.patient_ids.append(pid)

            state_msg = "admitted" if admit_directly else "in waiting room"
            logger.info(f"Created patient {first} {last} ({state_msg}) - Diagnosis: {diagnosis}")

            self.ensure_diagnosis_property()
            if self.diagnosis_property_id:
                self._add_diagnosis_property(pid, diagnosis)

            return pid, diagnosis
        else:
            self._log_errors("create_patient", response)
            return None, None

    def _add_diagnosis_property(self, patient_id: str, diagnosis: str) -> None:
        mutation = """
            mutation UpdatePatient($id: ID!, $data: UpdatePatientInput!) {
                updatePatient(id: $id, data: $data) {
                    id
                }
            }
        """
        variables = {
            "id": patient_id,
            "data": {
                "properties": [
                    {
                        "definitionId": self.diagnosis_property_id,
                        "textValue": diagnosis,
                    }
                ]
            }
        }

        response = self.client.query(mutation, variables)
        if "errors" in response:
            self._log_errors("_add_diagnosis_property", response)

    def admit_patient(self, patient_id: Optional[str] = None) -> bool:
        if not patient_id:
            if not self.patient_ids:
                return False
            patient_id = random.choice(self.patient_ids)

        mutation = """
            mutation AdmitPatient($id: ID!) {
                admitPatient(id: $id) {
                    id
                    state
                }
            }
        """
        response = self.client.query(mutation, {"id": patient_id})

        if "errors" in response:
            for error in response["errors"]:
                if "Patient not found" in error.get("message", ""):
                    logger.warning(f"Patient {patient_id} not found. Removing from list.")
                    if patient_id in self.patient_ids:
                        self.patient_ids.remove(patient_id)
                    return False
            self._log_errors("admit_patient", response)
            return False

        data = response.get("data")
        if data and data.get("admitPatient"):
            logger.info(f"Admitted patient {patient_id}")
            return True
        return False

    def discharge_patient(self, patient_id: Optional[str] = None) -> bool:
        if not patient_id:
            if not self.patient_ids:
                return False
            patient_id = random.choice(self.patient_ids)

        mutation = """
            mutation DischargePatient($id: ID!) {
                dischargePatient(id: $id) {
                    id
                    state
                }
            }
        """
        response = self.client.query(mutation, {"id": patient_id})

        if "errors" in response:
            for error in response["errors"]:
                if "Patient not found" in error.get("message", ""):
                    logger.warning(f"Patient {patient_id} not found. Removing from list.")
                    if patient_id in self.patient_ids:
                        self.patient_ids.remove(patient_id)
                    return False
            self._log_errors("discharge_patient", response)
            return False

        data = response.get("data")
        if data and data.get("dischargePatient"):
            logger.info(f"Discharged patient {patient_id}")
            if patient_id in self.patient_ids:
                self.patient_ids.remove(patient_id)
            return True
        return False

    def move_patient(self, patient_id: Optional[str] = None) -> bool:
        if not patient_id:
            if not self.patient_ids or not self.location_manager.locations:
                return False
            patient_id = random.choice(self.patient_ids)

        new_location = self.location_manager.get_random_location()
        if not new_location:
            return False

        mutation = """
            mutation MovePatient($id: ID!, $locationIds: [ID!]) {
                updatePatient(id: $id, data: { assignedLocationIds: $locationIds }) {
                    id
                    assignedLocations {
                        id
                        title
                    }
                }
            }
        """
        response = self.client.query(
            mutation,
            {"id": patient_id, "locationIds": [new_location]},
        )

        if "errors" in response:
            for error in response["errors"]:
                if "Patient not found" in error.get("message", ""):
                    logger.warning(f"Patient {patient_id} not found. Removing from list.")
                    if patient_id in self.patient_ids:
                        self.patient_ids.remove(patient_id)
                    return False
            self._log_errors("move_patient", response)
            return False

        data = response.get("data")
        if data and data.get("updatePatient"):
            locations = data["updatePatient"]["assignedLocations"]
            location_name = locations[0]["title"] if locations else "unknown"
            logger.info(f"Moved patient {patient_id} to {location_name}")
            return True
        return False

    def update_patient_position(self, patient_id: Optional[str] = None) -> bool:
        if not patient_id:
            if not self.patient_ids:
                return False
            patient_id = random.choice(self.patient_ids)

        new_bed = self.location_manager.get_random_bed()
        if not new_bed:
            return False

        mutation = """
            mutation UpdatePatientPosition($id: ID!, $positionId: ID) {
                updatePatient(id: $id, data: { positionId: $positionId }) {
                    id
                    position {
                        id
                        title
                    }
                }
            }
        """
        response = self.client.query(
            mutation,
            {"id": patient_id, "positionId": new_bed},
        )

        if "errors" in response:
            for error in response["errors"]:
                if "Patient not found" in error.get("message", ""):
                    logger.warning(f"Patient {patient_id} not found. Removing from list.")
                    if patient_id in self.patient_ids:
                        self.patient_ids.remove(patient_id)
                    return False
            self._log_errors("update_patient_position", response)
            return False

        data = response.get("data")
        if data and data.get("updatePatient"):
            position = data["updatePatient"].get("position")
            position_name = position["title"] if position else "none"
            logger.info(f"Updated patient {patient_id} position to {position_name}")
            return True
        return False
