from typing import Optional
from authentication import DirectGrantAuthenticator, InteractiveAuthenticator
from config import API_URL, PASSWORD, USE_DIRECT_GRANT, USERNAME, logger
import requests


class GraphQLClient:
    def __init__(self):
        self.token: Optional[str] = None
        self.session = requests.Session()
        if USE_DIRECT_GRANT and USERNAME and PASSWORD:
            self.authenticator = DirectGrantAuthenticator(self.session)
        else:
            self.authenticator = InteractiveAuthenticator(self.session)

    def _is_authentication_error(self, response: requests.Response) -> bool:
        if response.status_code == 401:
            return True
        if response.status_code == 400:
            try:
                error_data = response.json()
                if "errors" in error_data:
                    for error in error_data["errors"]:
                        message = error.get("message", "").lower()
                        if (
                            "unauthenticated" in message
                            or "not authenticated" in message
                        ):
                            return True
            except Exception:
                pass
        return False

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

            if self._is_authentication_error(response):
                logger.warning(
                    "Authentication error detected. Re-authenticating...",
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
