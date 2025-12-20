import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests
from config import (
    CALLBACK_PORT,
    CLIENT_ID,
    CLIENT_SECRET,
    KEYCLOAK_URL,
    PASSWORD,
    REALM,
    REDIRECT_URI,
    USERNAME,
    logger,
)


class OAuthCallbackHandler(BaseHTTPRequestHandler):
    auth_code: str | None = None

    def do_GET(self) -> None:
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

    def log_message(self, format: str, *args: Any) -> None:
        pass


class InteractiveAuthenticator:
    def __init__(self, session: requests.Session):
        self.session = session

    def login(self) -> str:
        logger.info("Opening browser for authentication...")

        auth_url = (
            f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/auth"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid profile email organization"
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


class DirectGrantAuthenticator:
    def __init__(self, session: requests.Session):
        self.session = session

    def login(self) -> str:
        if not USERNAME or not PASSWORD:
            raise Exception(
                "USERNAME and PASSWORD environment variables are required for non-interactive authentication",
            )

        logger.info("Authenticating with username/password...")

        token_url = (
            f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
        )
        data = {
            "grant_type": "password",
            "client_id": CLIENT_ID,
            "username": USERNAME,
            "password": PASSWORD,
            "scope": "openid profile email organization",
        }

        if CLIENT_SECRET:
            data["client_secret"] = CLIENT_SECRET

        max_retries = 5
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = self.session.post(token_url, data=data, timeout=10)

                if response.status_code == 200:
                    token_data = response.json()
                    logger.info("Authentication successful")
                    return token_data["access_token"]

                if response.status_code == 503 or response.status_code == 502:
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Keycloak not ready (HTTP {response.status_code}). "
                            f"Retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})",
                        )
                        time.sleep(retry_delay)
                        continue

                try:
                    error_data = response.json()
                    error_msg = error_data.get(
                        "error_description",
                        error_data.get("error", "Unknown error"),
                    )
                except Exception:
                    error_msg = (
                        f"HTTP {response.status_code}: {response.text[:100]}"
                    )

                raise Exception(
                    f"Authentication failed: {error_msg}. "
                    f"Make sure the client '{CLIENT_ID}' has 'Direct Access Grants' enabled in Keycloak "
                    f"and that USERNAME/PASSWORD are correct.",
                )
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Connection error during authentication: {e}. "
                        f"Retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})",
                    )
                    time.sleep(retry_delay)
                    continue
                raise

        raise Exception("Authentication failed after multiple retries")
