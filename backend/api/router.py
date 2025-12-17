from config import CLIENT_ID, ISSUER_URI
from fastapi import Request
from fastapi.responses import HTMLResponse
from strawberry.fastapi import GraphQLRouter


class AuthedGraphQLRouter(GraphQLRouter):
    async def render_graphql_ide(self, request: Request) -> HTMLResponse:
        response = await super().render_graphql_ide(request)

        redirect_uri = f"{request.base_url}callback"
        login_url = (
            f"{ISSUER_URI}/protocol/openid-connect/auth"
            f"?client_id={CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid profile email organization"
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
