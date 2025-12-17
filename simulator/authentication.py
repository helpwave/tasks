import webbrowser

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import threading
from config import *

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