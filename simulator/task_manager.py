from typing import List, Optional
from datetime import datetime, timedelta
from graphql_client import GraphQLClient
from config import logger
from data import RandomDataGenerator
from treatment_planner import TreatmentPlanner
import random


class TaskManager:
    def __init__(self, client: GraphQLClient):
        self.client = client
        self.task_ids: List[str] = []
        self.user_ids: List[str] = []
        self.current_user_id: Optional[str] = None

    def _log_errors(self, context: str, response: dict) -> None:
        if "errors" in response:
            logger.error(f"Error in {context}: {response['errors']}")

    def load_tasks(self) -> None:
        query = """
            query LoadTasks {
                tasks {
                    id
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")

        if not data:
            self._log_errors("load_tasks", response)
            return

        self.task_ids = [t["id"] for t in data.get("tasks", [])]
        logger.info(f"Loaded {len(self.task_ids)} tasks")

    def load_users(self) -> None:
        query = """
            query LoadUsers {
                users {
                    id
                    username
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")

        if not data:
            self._log_errors("load_users", response)
            return

        self.user_ids = [u["id"] for u in data.get("users", [])]
        logger.info(f"Loaded {len(self.user_ids)} users")

    def set_current_user(self, user_id: str) -> None:
        self.current_user_id = user_id
        if user_id not in self.user_ids:
            self.user_ids.append(user_id)

    def create_task(
        self,
        patient_id: Optional[str] = None,
        title: Optional[str] = None,
        assign_random: bool = False,
    ) -> Optional[str]:
        if not patient_id:
            return None

        if not title:
            title = RandomDataGenerator.get_task_title()

        assignee_id = None
        if assign_random and self.user_ids:
            assignee_id = random.choice(self.user_ids)
        elif self.current_user_id and random.random() > 0.3:
            assignee_id = self.current_user_id

        due_date = (
            datetime.now() + timedelta(hours=random.randint(1, 48))
        ).isoformat()

        mutation = """
            mutation CreateTask($title: String!, $patientId: ID!, $assigneeId: ID, $dueDate: DateTime) {
                createTask(data: {
                    title: $title,
                    patientId: $patientId,
                    assigneeId: $assigneeId,
                    dueDate: $dueDate
                }) {
                    id
                    title
                    assignee {
                        id
                        username
                    }
                    dueDate
                }
            }
        """
        variables = {
            "title": title,
            "patientId": patient_id,
            "assigneeId": assignee_id,
            "dueDate": due_date,
        }

        response = self.client.query(mutation, variables)
        data = response.get("data")

        if data and data.get("createTask"):
            task = data["createTask"]
            tid = task["id"]
            self.task_ids.append(tid)

            assignee_info = task.get("assignee")
            assignee_msg = ""
            if assignee_info:
                assignee_msg = (
                    f" assigned to {assignee_info.get('username', 'user')}"
                )
            else:
                assignee_msg = " (unassigned)"

            due_date_str = task.get("dueDate", due_date)
            logger.info(
                f"Created task '{title}'{assignee_msg} due {due_date_str}"
            )
            return tid
        else:
            self._log_errors("create_task", response)
            return None

    def create_treatment_tasks(
        self, patient_id: str, diagnosis: str
    ) -> List[str]:
        treatments = TreatmentPlanner.get_treatments_for_diagnosis(diagnosis)
        task_ids = []

        for treatment in treatments:
            assign_random = random.random() > 0.4
            tid = self.create_task(
                patient_id=patient_id,
                title=treatment,
                assign_random=assign_random,
            )
            if tid:
                task_ids.append(tid)

        return task_ids

    def update_task(self) -> bool:
        if not self.task_ids:
            return False

        tid = random.choice(self.task_ids)
        complete = random.choice([True, False])

        mutation = """
            mutation UpdateTask($id: ID!) {
                %s(id: $id) {
                    id
                    done
                }
            }
        """ % (
            "completeTask" if complete else "reopenTask"
        )

        response = self.client.query(mutation, {"id": tid})

        if "errors" in response:
            for error in response["errors"]:
                if "Task not found" in error.get("message", ""):
                    logger.warning(
                        f"Task {tid} not found (deleted?). Removing from local list.",
                    )
                    if tid in self.task_ids:
                        self.task_ids.remove(tid)
                    return False
            self._log_errors("update_task", response)
            return False

        data = response.get("data")
        result_key = "completeTask" if complete else "reopenTask"

        if data and data.get(result_key):
            status = "DONE" if complete else "OPEN"
            logger.info(f"Updated task {tid} -> status: {status}")
            return True
        return False
