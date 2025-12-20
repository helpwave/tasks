from typing import List, Optional
from graphql_client import GraphQLClient
from config import logger
from data import RandomDataGenerator
import random


class LocationManager:
    def __init__(self, client: GraphQLClient):
        self.client = client
        self.all_locations: List[dict] = []
        self.locations: List[str] = []
        self.beds: List[str] = []
        self.rooms: List[str] = []
        self.teams: List[str] = []
        self.wards: List[str] = []
        self.clinics: List[str] = []

    def _log_errors(self, context: str, response: dict) -> None:
        if "errors" in response:
            logger.error(f"Error in {context}: {response['errors']}")

    def load_locations(self) -> None:
        query = """
            query LoadLocations {
                locationNodes {
                    id
                    title
                    kind
                    parentId
                }
            }
        """
        response = self.client.query(query)
        data = response.get("data")

        if not data:
            self._log_errors("load_locations", response)
            return

        self.all_locations = data.get("locationNodes", [])

        self.locations = [
            loc["id"] for loc in self.all_locations if loc["kind"] in ["BED", "ROOM"]
        ]
        self.beds = [
            loc["id"] for loc in self.all_locations if loc["kind"] == "BED"
        ]
        self.rooms = [
            loc["id"] for loc in self.all_locations if loc["kind"] == "ROOM"
        ]
        self.teams = [
            loc["id"] for loc in self.all_locations if loc["kind"] == "TEAM"
        ]
        self.wards = [
            loc["id"] for loc in self.all_locations if loc["kind"] == "WARD"
        ]
        self.clinics = [
            loc["id"] for loc in self.all_locations if loc["kind"] == "CLINIC"
        ]

        logger.info(
            f"Locations loaded: {len(self.beds)} beds, {len(self.rooms)} rooms, "
            f"{len(self.teams)} teams, {len(self.wards)} wards, {len(self.clinics)} clinics"
        )

    def print_structure(self) -> None:
        logger.info("\n" + "=" * 60)
        logger.info("LOCATION STRUCTURE")
        logger.info("=" * 60)

        if not self.all_locations:
            logger.info("No locations found.")
            return

        nodes = {loc["id"]: loc for loc in self.all_locations}
        children_map = {loc["id"]: [] for loc in self.all_locations}
        roots = []

        for loc in self.all_locations:
            pid = loc.get("parentId")
            if pid and pid in nodes:
                children_map[pid].append(loc["id"])
            else:
                roots.append(loc["id"])

        def print_tree(node_id: str, prefix: str = "", is_last: bool = True):
            node = nodes[node_id]
            connector = "└── " if is_last else "├── "
            kind_icon = {
                "CLINIC": "🏥",
                "WARD": "🏢",
                "TEAM": "👥",
                "ROOM": "🚪",
                "BED": "🛏️",
            }.get(node["kind"], "📍")
            print(f"{prefix}{connector}{kind_icon} {node['title']} ({node['kind']})")

            children = sorted(children_map[node_id], key=lambda cid: nodes[cid]["title"])
            for i, child_id in enumerate(children):
                is_last_child = i == len(children) - 1
                new_prefix = prefix + ("    " if is_last else "│   ")
                print_tree(child_id, new_prefix, is_last_child)

        for i, root_id in enumerate(sorted(roots, key=lambda rid: nodes[rid]["title"])):
            print_tree(root_id, "", i == len(roots) - 1)
        print("\n")

    def create_location(
        self,
        title: str,
        kind: str,
        parent_id: Optional[str] = None,
    ) -> Optional[str]:
        logger.debug(f"Location creation requested: {title} ({kind}) - not implemented via API")
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
            logger.info("Hospital structure already exists.")
            return

        logger.warning(
            "No locations found. Locations should be created via scaffold data "
            "(see backend/scaffold.py). The simulator will work with existing locations only."
        )
        self.load_locations()

    def add_team_to_ward(self, ward_id: Optional[str] = None) -> Optional[str]:
        if not ward_id:
            if not self.wards:
                logger.warning("No wards available to add team to")
                return None
            ward_id = random.choice(self.wards)

        # Get ward info
        ward = next((loc for loc in self.all_locations if loc["id"] == ward_id), None)
        if not ward:
            return None

        # Generate team name
        available_teams = [
            name for name in RandomDataGenerator.team_names
            if not any(
                loc["title"] == name and loc.get("parentId") == ward_id
                for loc in self.all_locations
            )
        ]
        if not available_teams:
            team_name = f"Team {random.randint(1, 100)}"
        else:
            team_name = random.choice(available_teams)

        logger.info(
            f"Would add new team '{team_name}' to ward '{ward['title']}' "
            f"(location creation via API not available - use scaffold data)"
        )
        return None

    def get_random_bed(self) -> Optional[str]:
        if not self.beds:
            return None
        return random.choice(self.beds)

    def get_random_room(self) -> Optional[str]:
        if not self.rooms:
            return None
        return random.choice(self.rooms)

    def get_random_location(self) -> Optional[str]:
        if not self.locations:
            return None
        return random.choice(self.locations)
