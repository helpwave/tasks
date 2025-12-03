import logging

import requests
from api.context import Context
from api.resolvers import Mutation, Query, Subscription
from auth import (
    UnauthenticatedRedirect,
    get_user_payload,
    unauthenticated_redirect_handler,
)
from config import (
    CLIENT_ID,
    CLIENT_SECRET,
    IS_DEV,
    ISSUER_URI,
    LOGGER,
)
from database.models.user import User
from database.session import get_db_session
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from graphql import FieldNode
from sqlalchemy import select
from starlette.requests import HTTPConnection
from strawberry import Schema
from strawberry.extensions import SchemaExtension
from strawberry.fastapi import GraphQLRouter

logger = logging.getLogger(LOGGER)


class GlobalAuthExtension(SchemaExtension):
    def on_execute(self):
        execution_context = self.execution_context
        user = execution_context.context.user

        if user:
            yield
            return

        document = execution_context.graphql_document
        if document:
            for definition in document.definitions:
                if definition.kind == "operation_definition":
                    for selection in definition.selection_set.selections:
                        if not isinstance(selection, FieldNode):
                            raise HTTPException(
                                status_code=401,
                                detail="Not authenticated",
                            )
                        if not selection.name.value.startswith("__"):
                            raise HTTPException(
                                status_code=401,
                                detail="Not authenticated",
                            )

        yield


async def get_context(
    connection: HTTPConnection,
    session=Depends(get_db_session),
) -> Context:
    user_payload = get_user_payload(connection)

    db_user = None

    if user_payload:
        user_id = user_payload.get("sub")
        username = user_payload.get("preferred_username") or user_payload.get(
            "name",
        )
        firstname = user_payload.get("given_name")
        lastname = user_payload.get("family_name")

        if user_id:
            result = await session.execute(
                select(User).where(User.id == user_id),
            )
            db_user = result.scalars().first()

            if not db_user:
                db_user = User(
                    id=user_id,
                    name=username,
                    firstname=firstname,
                    lastname=lastname,
                    title="User",
                )
                session.add(db_user)
            elif (
                db_user.name != username
                or db_user.firstname != firstname
                or db_user.lastname != lastname
            ):
                db_user.name = username
                db_user.firstname = firstname
                db_user.lastname = lastname

            await session.commit()
            await session.refresh(db_user)

    return Context(db=session, user=db_user)


schema = Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
    extensions=[GlobalAuthExtension],
)


class AuthedGraphQLRouter(GraphQLRouter):
    async def render_graphql_ide(self, request: Request) -> HTMLResponse:
        response = await super().render_graphql_ide(request)

        redirect_uri = f"{request.base_url}callback"
        login_url = (
            f"{ISSUER_URI}/protocol/openid-connect/auth"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid profile email"
            f"&redirect_uri={redirect_uri}"
        )
        logout_url = f"{request.base_url}logout"

        is_authenticated = (
            "true" if request.cookies.get("access_token") else "false"
        )

        injection_script = f"""
        <script>
            (function() {{
                var loginUrl = "{login_url}";
                var logoutUrl = "{logout_url}";
                var isAuthenticated = {is_authenticated};
                
                function injectAuthButton() {{
                    var sidebars = document.querySelectorAll('.graphiql-sidebar-section');
                    var sidebar = sidebars[0]; 
                    
                    if (sidebar && !document.getElementById('custom-auth-button')) {{
                        var button = document.createElement('button');
                        button.id = 'custom-auth-button';
                        button.className = 'graphiql-un-styled';
                        button.type = 'button';
                        
                        if (isAuthenticated) {{
                            button.setAttribute('aria-label', 'Logout');
                            button.title = 'Logout';
                            button.innerHTML = `
                                <svg height="1em" viewBox="0 0 24 24" fill="none" 
                                     stroke="currentColor" stroke-width="1.5" 
                                     stroke-linecap="round" stroke-linejoin="round" 
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            `;
                            button.onclick = function() {{
                                window.location.href = logoutUrl;
                            }};
                        }} else {{
                            button.setAttribute('aria-label', 'Login with OIDC');
                            button.title = 'Login with OIDC';
                            button.innerHTML = `
                                <svg height="1em" viewBox="0 0 24 24" fill="none" 
                                     stroke="currentColor" stroke-width="1.5" 
                                     stroke-linecap="round" stroke-linejoin="round" 
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                            `;
                            button.onclick = function() {{
                                window.location.href = loginUrl;
                            }};
                        }}

                        sidebar.appendChild(button);
                    }}
                }}

                var observer = new MutationObserver(function(mutations) {{
                    injectAuthButton();
                }});

                observer.observe(document.body, {{
                    childList: true,
                    subtree: true
                }});
                
                injectAuthButton();
            }})();
        </script>
        """

        html_content = response.body.decode("utf-8")
        new_html = html_content.replace(
            "</body>",
            f"{injection_script}</body>",
        )

        return HTMLResponse(new_html)


graphql_app = AuthedGraphQLRouter(
    schema,
    context_getter=get_context,
    graphql_ide=IS_DEV,
)


app = FastAPI(
    title="helpwave tasks",
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)

app.add_exception_handler(
    UnauthenticatedRedirect,
    unauthenticated_redirect_handler,
)


@app.get("/logout")
def logout(_: Request):
    response = RedirectResponse(url="/graphql")
    response.delete_cookie(
        "access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )
    return response


@app.get("/callback")
def oauth_callback(code: str, request: Request):
    token_endpoint = f"{ISSUER_URI}/protocol/openid-connect/token"
    redirect_uri = f"{request.base_url}callback"

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": redirect_uri,
    }

    try:
        response = requests.post(token_endpoint, data=payload, timeout=10)

        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get("access_token")

        resp = RedirectResponse(url="/graphql")
        resp.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            max_age=3600,
            samesite="lax",
            secure=True,
        )
        return resp

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Authentication failed during token exchange",
        )


app.include_router(graphql_app, prefix="/graphql")

if IS_DEV:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
