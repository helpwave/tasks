from __future__ import annotations

import ssl


def where() -> str:
    paths = ssl.get_default_verify_paths()
    if paths.cafile:
        return paths.cafile
    if paths.openssl_cafile:
        return paths.openssl_cafile
    return ""
