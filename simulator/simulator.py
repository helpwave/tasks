from typing import Optional
from graphql_client import GraphQLClient
from config import logger
from location_manager import LocationManager
from patient_manager import PatientManager
from task_manager import TaskManager
import random
import time


class ClinicSimulator:
    def __init__(self):
        self.client = GraphQLClient()
        self.location_manager = LocationManager(self.client)
        self.patient_manager = PatientManager(self.client, self.location_manager)
        self.task_manager = TaskManager(self.client)
        self.user_id: Optional[str] = None

    def fetch_current_user(self) -> None:
        query = """
            query GetMe {
                me {
                    id
                    username
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")
        if data and data.get("me"):
            self.user_id = data["me"]["id"]
            self.task_manager.set_current_user(self.user_id)
            logger.info(
                f"Logged in as user: {data['me']['username']} ({self.user_id})",
            )
        else:
            self._log_errors("fetch_current_user", response)

    def _log_errors(self, context: str, response: dict) -> None:
        if "errors" in response:
            logger.error(f"Error in {context}: {response['errors']}")

    def load_state(self) -> None:
        self.location_manager.load_locations()
        self.patient_manager.load_patients()
        self.task_manager.load_tasks()
        self.task_manager.load_users()

    def run(self) -> None:
        self.client.query("{ __typename }")
        self.fetch_current_user()
        self.load_state()
        self.location_manager.ensure_hospital_structure()
        self.location_manager.print_structure()

        logger.info("Creating initial patients...")
        while len(self.patient_manager.patient_ids) < 5:
            admit_directly = random.random() < 0.4
            patient_id, diagnosis = self.patient_manager.create_patient(admit_directly=admit_directly)

            if patient_id and diagnosis:
                self.task_manager.create_treatment_tasks(patient_id, diagnosis)

        logger.info("Starting continuous simulation loop...")

        actions = [
            (self._action_create_task, 0.25),
            (self._action_update_task, 0.20),
            (self._action_create_patient, 0.15),
            (self._action_admit_patient, 0.10),
            (self._action_move_patient, 0.10),
            (self._action_update_position, 0.08),
            (self._action_discharge_patient, 0.07),
            (self._action_add_team, 0.05),
        ]

        while True:
            try:
                func = random.choices(
                    [a[0] for a in actions],
                    weights=[a[1] for a in actions],
                )[0]

                func()
                time.sleep(random.uniform(2.0, 5.0))

            except KeyboardInterrupt:
                logger.info("Simulation stopped by user.")
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                time.sleep(5)

    def _action_create_task(self) -> None:
        if not self.patient_manager.patient_ids:
            return
        patient_id = random.choice(self.patient_manager.patient_ids)
        self.task_manager.create_task(patient_id, assign_random=True)

    def _action_update_task(self) -> None:
        self.task_manager.update_task()

    def _action_create_patient(self) -> None:
        admit_directly = random.random() < 0.3
        patient_id, diagnosis = self.patient_manager.create_patient(admit_directly=admit_directly)
        if patient_id and diagnosis:
            self.task_manager.create_treatment_tasks(patient_id, diagnosis)

    def _action_admit_patient(self) -> None:
        if not self.patient_manager.patient_ids:
            return
        self.patient_manager.admit_patient()
        location = self.location_manager.get_random_location()
        if location:
            self.patient_manager.move_patient()

    def _action_move_patient(self) -> None:
        self.patient_manager.move_patient()

    def _action_update_position(self) -> None:
        self.patient_manager.update_patient_position()

    def _action_discharge_patient(self) -> None:
        self.patient_manager.discharge_patient()

    def _action_add_team(self) -> None:
        self.location_manager.add_team_to_ward()
        self.location_manager.load_locations()
