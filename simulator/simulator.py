from typing import List, Optional
from graphql_client import GraphQLClient
from config import logger
import random
from data import RandomDataGenerator
import time


class ClinicSimulator:
  def __init__(self):
    self.client = GraphQLClient()
    self.all_locations: List[dict] = []
    self.locations: List[str] = []
    self.patient_ids: List[str] = []
    self.task_ids: List[str] = []
    self.user_id: Optional[str] = None

  def _log_errors(self, context: str, response: dict) -> None:
    if "errors" in response:
      logger.error(f"Error in {context}: {response['errors']}")

  def load_state(self) -> None:
    query = """
      query LoadState {
          locationNodes {
              id
              title
              kind
              parentId
          }
          patients {
              id
          }
          tasks {
              id
          }
      }
      """
    response = self.client.query(query)
    data = response.get("data")

    if not data:
      self._log_errors("load_state", response)
      return

    self.all_locations = data.get("locationNodes", [])

    self.locations = [
      l["id"] for l in self.all_locations if l["kind"] in ["BED", "ROOM"]
    ]
    self.patient_ids = [p["id"] for p in data.get("patients", [])]
    self.task_ids = [t["id"] for t in data.get("tasks", [])]

    logger.info(
      f"State loaded: {len(self.locations)} assignable locations, {len(self.patient_ids)} patients, {len(self.task_ids)} tasks",
    )

  def print_structure(self) -> None:
    logger.info("\n" + "=" * 40)
    logger.info("CURRENT LOCATION HIERARCHY")
    logger.info("=" * 40)

    nodes = {l["id"]: l for l in self.all_locations}
    children_map = {l["id"]: [] for l in self.all_locations}
    roots = []

    for l in self.all_locations:
      pid = l.get("parentId")
      if pid and pid in nodes:
        children_map[pid].append(l["id"])
      else:
        roots.append(l["id"])

    def print_tree(node_id: str, prefix: str = "", is_last: bool = True):
      node = nodes[node_id]
      connector = "└── " if is_last else "├── "
      print(f"{prefix}{connector}{node['title']} ({node['kind']})")

      children = children_map[node_id]
      for i, child_id in enumerate(children):
        is_last_child = i == len(children) - 1
        new_prefix = prefix + ("    " if is_last else "│   ")
        print_tree(child_id, new_prefix, is_last_child)

    for i, root_id in enumerate(roots):
      print_tree(root_id, "", i == len(roots) - 1)
    print("\n")

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
      logger.info(
        f"Logged in as user: {data['me']['username']} ({self.user_id})",
      )
    else:
      self._log_errors("fetch_current_user", response)

  def create_location(
    self,
    title: str,
    kind: str,
    parent_id: Optional[str] = None,
  ) -> Optional[str]:
    mutation = """
      mutation CreateLocation($title: String!, $kind: LocationType!, $parentId: ID) {
          createLocationNode(data: {
              title: $title,
              kind: $kind,
              parentId: $parentId
          }) {
              id
          }
      }
      """
    variables = {
      "title": title,
      "kind": kind,
      "parentId": parent_id,
    }
    response = self.client.query(mutation, variables)
    data = response.get("data")

    if data and data.get("createLocationNode"):
      return data["createLocationNode"]["id"]

    self._log_errors(f"create_location({title})", response)
    return None

  def create_rooms_and_beds(
    self,
    parent_id: str,
    prefix: str,
    num_rooms: int = 3,
    beds_per_room: int = 2,
  ) -> None:
    for r in range(1, num_rooms + 1):
      room_id = self.create_location(
        f"{prefix} Room {r}",
        "ROOM",
        parent_id,
      )
      if not room_id:
        continue
      for b in range(1, beds_per_room + 1):
        self.create_location(f"Bed {b}", "BED", room_id)

  def ensure_hospital_structure(self) -> None:
    if self.locations:
      return

    logger.info(
      "No locations found. Generating default hospital structure...",
    )

    clinic_id = self.create_location("Uniclinic", "CLINIC")
    if not clinic_id:
      logger.error(
        "Failed to create clinic. Aborting structure generation.",
      )
      return

    icu_id = self.create_location("Intensive Care", "WARD", clinic_id)
    if icu_id:
      dream_team_id = self.create_location("Dream Team", "TEAM", icu_id)
      if dream_team_id:
        self.create_rooms_and_beds(dream_team_id, "ICU")

    surgery_id = self.create_location("Surgery", "WARD", clinic_id)
    if surgery_id:
      for team_name in ["Surgical Team A", "Surgical Team B"]:
        team_id = self.create_location(team_name, "TEAM", surgery_id)
        if team_id:
          self.create_rooms_and_beds(team_id, "SURG")

    random_wards_count = random.randint(1, 2)
    selected_wards = random.sample(
      RandomDataGenerator.ward_names,
      random_wards_count,
    )

    for ward_name in selected_wards:
      ward_id = self.create_location(ward_name, "WARD", clinic_id)
      if not ward_id:
        continue

      random_teams_count = random.randint(1, 2)
      selected_teams = random.sample(
        RandomDataGenerator.team_names,
        random_teams_count,
      )

      for team_name in selected_teams:
        team_id = self.create_location(team_name, "TEAM", ward_id)
        if team_id:
          self.create_rooms_and_beds(team_id, f"{ward_name[:3]}")

    logger.info("Hospital structure generation complete.")
    self.load_state()

  def create_patient(self) -> None:
    if not self.locations:
      logger.warning("No locations available to assign patient")
      return

    first, last = RandomDataGenerator.get_name()
    mutation = """
      mutation CreatePatient($firstname: String!, $lastname: String!, $birthdate: Date!, $sex: Sex!, $locationIds: [ID!]) {
          createPatient(data: {
              firstname: $firstname,
              lastname: $lastname,
              birthdate: $birthdate,
              sex: $sex,
              assignedLocationIds: $locationIds
          }) {
              id
              name
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
      "locationIds": [random.choice(self.locations)],
    }

    response = self.client.query(mutation, variables)
    data = response.get("data")

    if data and data.get("createPatient"):
      pid = data["createPatient"]["id"]
      self.patient_ids.append(pid)
      logger.info(f"Created patient {first} {last}")

      for _ in range(random.randint(1, 3)):
        self.create_task(pid)
    else:
      self._log_errors("create_patient", response)

  def create_task(self, patient_id: Optional[str] = None) -> None:
    if not patient_id:
      if not self.patient_ids:
        return
      patient_id = random.choice(self.patient_ids)

    title = RandomDataGenerator.get_task_title()
    due_date = RandomDataGenerator.get_due_date()

    assignee_id = None
    if self.user_id and random.random() > 0.2:
      assignee_id = self.user_id

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
      self.task_ids.append(data["createTask"]["id"])
      assigned_msg = (
        f" assigned to Me ({self.user_id})"
        if assignee_id
        else " (unassigned)"
      )
      logger.info(f"Created task '{title}'{assigned_msg} due {due_date}")
    else:
      self._log_errors("create_task", response)

  def update_task(self) -> None:
    if not self.task_ids:
      return

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
          self.task_ids.remove(tid)
          return
      # Log other errors
      self._log_errors("update_task", response)

    data = response.get("data")
    result_key = "completeTask" if complete else "reopenTask"

    if data and data.get(result_key):
      status = "DONE" if complete else "OPEN"
      logger.info(f"Updated task {tid} -> status: {status}")

  def move_patient(self) -> None:
    if not self.patient_ids or not self.locations:
      return

    pid = random.choice(self.patient_ids)
    lid = random.choice(self.locations)

    mutation = """
      mutation MovePatient($id: ID!, $locationIds: [ID!]) {
          updatePatient(id: $id, data: { assignedLocationIds: $locationIds }) {
              id
              assignedLocations {
                  id
              }
          }
      }
      """
    response = self.client.query(
      mutation,
      {"id": pid, "locationIds": [lid]},
    )

    if "errors" in response:
      for error in response["errors"]:
        if "Patient not found" in error.get("message", ""):
          logger.warning(
            f"Patient {pid} not found. Removing from list.",
          )
          self.patient_ids.remove(pid)
          return
      self._log_errors("move_patient", response)

    data = response.get("data")
    if data and data.get("updatePatient"):
      logger.info(f"Moved patient {pid} to new location {lid}")

  def delete_patient(self) -> None:
    if not self.patient_ids:
      return

    pid = random.choice(self.patient_ids)
    mutation = """
      mutation DeletePatient($id: ID!) {
          deletePatient(id: $id)
      }
      """
    response = self.client.query(mutation, {"id": pid})
    data = response.get("data")

    if data and data.get("deletePatient"):
      self.patient_ids.remove(pid)
      logger.info(f"Deleted patient {pid}")
    elif "errors" in response:
      self._log_errors("delete_patient", response)

  def run(self) -> None:
    self.client.query("{ __typename }")

    self.fetch_current_user()
    self.load_state()
    self.ensure_hospital_structure()
    self.print_structure()

    while len(self.patient_ids) < 5:
      self.create_patient()

    logger.info("Starting continuous simulation loop...")

    actions = [
      (self.create_task, 0.40),
      (self.update_task, 0.35),
      (self.move_patient, 0.10),
      (self.create_patient, 0.10),
      (self.delete_patient, 0.05),
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
