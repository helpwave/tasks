from typing import Optional
from authentication import InteractiveAuthenticator
from config import API_URL, logger
import requests


class GraphQLClient:
    def __init__(self):
        self.token: Optional[str] = None
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
