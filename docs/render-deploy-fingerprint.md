# Render deployment fingerprint

PacketPath exposes `GET /api/deploy-info` so support can verify the exact Render web service, repository, branch, commit, and hostname that are serving traffic. The endpoint only returns Render-provided deployment metadata and does not expose application secrets.
