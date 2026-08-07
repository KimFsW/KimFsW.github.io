"""Identity module (stub).

Responsibility: login, token refresh, session revocation, device binding.
Owns endpoints: POST /v1/auth/sessions, POST /v1/auth/refresh.
Must NOT contain: event or camera logic (design doc 3.1 Identity).
Refresh tokens are stored hashed; iOS keeps them in Keychain (7.1).
"""
