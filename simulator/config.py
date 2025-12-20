import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
API_URL = os.getenv("API_URL", "http://localhost:8000/graphql")
REALM = os.getenv("REALM", "tasks")
USE_DIRECT_GRANT = os.getenv("USE_DIRECT_GRANT", "false").lower() == "true"
CLIENT_ID = os.getenv("CLIENT_ID", "tasks-web")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "")
USERNAME = os.getenv("USERNAME", "test")
PASSWORD = os.getenv("PASSWORD", "test")

CALLBACK_PORT = 8999
REDIRECT_URI = f"http://localhost:{CALLBACK_PORT}/callback"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)
