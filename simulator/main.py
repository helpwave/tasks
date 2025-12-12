import logging
import os
import random
import sys
import threading
import time
import webbrowser
from datetime import date, datetime, timedelta
from enum import Enum
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

import requests
from dotenv import load_dotenv

load_dotenv()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
API_URL = os.getenv("API_URL", "http://localhost:8000/graphql")
REALM = os.getenv("REALM", "tasks")
CLIENT_ID = os.getenv("CLIENT_ID", "tasks-web")

CALLBACK_PORT = 8999
REDIRECT_URI = f"http://localhost:{CALLBACK_PORT}/callback"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


class Sex(Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    UNKNOWN = "UNKNOWN"


class RandomDataGenerator:
    first_names = [
        "James",
        "Mary",
        "John",
        "Patricia",
        "Robert",
        "Jennifer",
        "Michael",
        "Linda",
        "William",
        "Elizabeth",
        "David",
        "Barbara",
        "Richard",
        "Susan",
        "Joseph",
        "Jessica",
        "Thomas",
        "Sarah",
        "Charles",
        "Karen",
    ]
    last_names = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
    ]
    task_titles = [
        "Check blood pressure",
        "Administer insulin",
        "Change wound dressing",
        "Patient transport to X-Ray",
        "Update patient chart",
        "Morning rounds",
        "Check vitals",
        "Administer pain medication",
        "Prepare discharge papers",
        "Consult with specialist",
        "Dietary review",
        "Physical therapy session",
    ]
    ward_names = [
        "Cardiology",
        "Neurology",
        "Pediatrics",
        "Oncology",
        "Emergency",
        "Orthopedics",
        "Geriatrics",
        "Psychiatry",
    ]
    team_names = [
        "Alpha Team",
        "Bravo Team",
        "Night Watch",
        "Early Birds",
        "Rapid Response",
        "Surgical Team A",
        "Consultant Group",
    ]

    @staticmethod
    def get_name():
        return random.choice(RandomDataGenerator.first_names), random.choice(
            RandomDataGenerator.last_names,
        )

    @staticmethod
    def get_task_title():
        return random.choice(RandomDataGenerator.task_titles)

    @staticmethod
    def get_birthdate():
        start_date = date(1940, 1, 1)
        end_date = date(2005, 12, 31)
        delta = end_date - start_date
        random_days = random.randrange(delta.days)
        return (start_date + timedelta(days=random_days)).isoformat()

    @staticmethod
    def get_due_date():
        now = datetime.now()
        random_hours = random.randint(1, 168)
        return (now + timedelta(hours=random_hours)).isoformat()

    @staticmethod
    def get_sex():
        return random.choice(list(Sex)).value


class OAuthCallbackHandler(BaseHTTPRequestHandler):
    auth_code = None

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/callback":
            query_params = parse_qs(parsed_url.query)
            if "code" in query_params:
                OAuthCallbackHandler.auth_code = query_params["code"][0]

                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(
                    b"""
                    <html>
                    <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                        <h1 style="color: #4CAF50;">Login Successful</h1>
                        <p>You can close this window and check your terminal.</p>
                        <script>window.close();</script>
                    </body>
                    </html>
                """,
                )

                threading.Thread(target=self.server.shutdown).start()
            else:
                self.send_error(400, "Authorization code not found in request")
        else:
            self.send_error(404, "Not Found")

    def log_message(self, format, *args):
        pass


class InteractiveAuthenticator:
    def __init__(self, session):
        self.session = session

    def login(self) -> str:
        logger.info("Opening browser for authentication...")

        auth_url = (
            f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/auth"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid profile email"
            f"&redirect_uri={REDIRECT_URI}"
        )

        server = HTTPServer(("localhost", CALLBACK_PORT), OAuthCallbackHandler)
        OAuthCallbackHandler.auth_code = None

        webbrowser.open(auth_url)
        logger.info(f"Waiting for login at {REDIRECT_URI}...")

        server.serve_forever()
        server.server_close()

        code = OAuthCallbackHandler.auth_code
        if not code:
            raise Exception("Failed to capture authorization code")

        return self._exchange_code(code)

    def _exchange_code(self, code: str) -> str:
        logger.info("Exchanging code for access token...")
        token_url = (
            f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
        )
        data = {
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "code": code,
            "redirect_uri": REDIRECT_URI,
        }

        response = self.session.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()
        logger.info("Authentication successful")
        return token_data["access_token"]


class GraphQLClient:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.authenticator = InteractiveAuthenticator(self.session)

    def query(self, query: str, variables: dict = None) -> dict:
        if not self.token:
            self.token = self.authenticator.login()

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        payload = {"query": query, "variables": variables or {}}

        try:
            response = self.session.post(
                API_URL,
                json=payload,
                headers=headers,
            )

            if response.status_code == 401:
                logger.warning(
                    "Token expired (401). Initiating re-authentication...",
                )
                self.token = self.authenticator.login()
                headers["Authorization"] = f"Bearer {self.token}"
                response = self.session.post(
                    API_URL,
                    json=payload,
                    headers=headers,
                )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Network Request failed: {e}")
            return {}


class ClinicSimulator:
    def __init__(self):
        self.client = GraphQLClient()
        self.all_locations = []
        self.locations = []
        self.patient_ids = []
        self.task_ids = []
        self.user_id = None

    def load_state(self):
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
        data = response.get("data", {})

        self.all_locations = data.get("locationNodes", [])

        self.locations = [
            l["id"] for l in self.all_locations if l["kind"] in ["BED", "ROOM"]
        ]
        self.patient_ids = [p["id"] for p in data.get("patients", [])]
        self.task_ids = [t["id"] for t in data.get("tasks", [])]

        logger.info(
            f"State loaded: {len(self.locations)} assignable locations, {len(self.patient_ids)} patients, {len(self.task_ids)} tasks",
        )

    def print_structure(self):
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

        def print_tree(node_id, prefix="", is_last=True):
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

    def fetch_current_user(self):
        query = """
        query GetMe {
            me {
                id
                username
            }
        }
        """
        response = self.client.query(query)
        data = response.get("data", {})
        if data.get("me"):
            self.user_id = data["me"]["id"]
            logger.info(
                f"Logged in as user: {data['me']['username']} ({self.user_id})",
            )

    def create_location(self, title, kind, parent_id=None):
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
        data = response.get("data", {})
        if data and data.get("createLocationNode"):
            return data["createLocationNode"]["id"]
        return None

    def create_rooms_and_beds(
        self,
        parent_id,
        prefix,
        num_rooms=3,
        beds_per_room=2,
    ):
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

    def ensure_hospital_structure(self):
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

    def create_patient(self):
        if not self.locations:
            logger.warning("No locations available to assign patient")
            return

        first, last = RandomDataGenerator.get_name()
        mutation = """
        mutation CreatePatient($firstname: String!, $lastname: String!, $birthdate: Date!, $sex: Sex!, $locationId: ID) {
            createPatient(data: {
                firstname: $firstname,
                lastname: $lastname,
                birthdate: $birthdate,
                sex: $sex,
                assignedLocationId: $locationId
            }) {
                id
                name
            }
        }
        """
        variables = {
            "firstname": first,
            "lastname": last,
            "birthdate": RandomDataGenerator.get_birthdate(),
            "sex": RandomDataGenerator.get_sex(),
            "locationId": random.choice(self.locations),
        }

        response = self.client.query(mutation, variables)
        data = response.get("data", {})
        if data.get("createPatient"):
            pid = data["createPatient"]["id"]
            self.patient_ids.append(pid)
            logger.info(f"Created patient {first} {last}")

            for _ in range(random.randint(1, 3)):
                self.create_task(pid)

    def create_task(self, patient_id=None):
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
        data = response.get("data", {})
        if data.get("createTask"):
            self.task_ids.append(data["createTask"]["id"])
            assigned_msg = (
                f" assigned to Me ({self.user_id})"
                if assignee_id
                else " (unassigned)"
            )
            logger.info(f"Created task '{title}'{assigned_msg} due {due_date}")

    def update_task(self):
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

        data = response.get("data", {})
        result_key = "completeTask" if complete else "reopenTask"
        if data and data.get(result_key):
            status = "DONE" if complete else "OPEN"
            logger.info(f"Updated task {tid} -> status: {status}")

    def move_patient(self):
        if not self.patient_ids or not self.locations:
            return

        pid = random.choice(self.patient_ids)
        lid = random.choice(self.locations)

        mutation = """
        mutation MovePatient($id: ID!, $lid: ID) {
            updatePatient(id: $id, data: { assignedLocationId: $lid }) {
                id
            }
        }
        """
        response = self.client.query(mutation, {"id": pid, "lid": lid})

        if "errors" in response:
            for error in response["errors"]:
                if "Patient not found" in error.get("message", ""):
                    logger.warning(
                        f"Patient {pid} not found. Removing from list.",
                    )
                    self.patient_ids.remove(pid)
                    return

        data = response.get("data", {})
        if data.get("updatePatient"):
            logger.info(f"Moved patient {pid} to new location {lid}")

    def delete_patient(self):
        if not self.patient_ids:
            return

        pid = random.choice(self.patient_ids)
        mutation = """
        mutation DeletePatient($id: ID!) {
            deletePatient(id: $id)
        }
        """
        response = self.client.query(mutation, {"id": pid})
        data = response.get("data", {})

        if data.get("deletePatient"):
            self.patient_ids.remove(pid)
            logger.info(f"Deleted patient {pid}")

    def run(self):
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


if __name__ == "__main__":
    ClinicSimulator().run()
