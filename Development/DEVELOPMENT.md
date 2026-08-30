# AgniDrishti Development Log

## Recent Fixes
- **TypeScript Fix**: Addressed TS 7.0 deprecation warning concerning `moduleResolution: "node10"` by updating `module` and `moduleResolution` to `Node16` in API and `shared-types` packages. This preserves CommonJS behavior while maintaining compatibility.
- **Track A & B Integration**:
  - Investigated ML feature integration in `apps/classifier/track_a_integration.py` and `apps/classifier/main.py`.
  - Fixed ESA Worldcover tile path resolution (`tiles/tiles` issue).
  - Dynamically linked `TRACK_B_CONTRACT_PATH` from `__file__`.
- **Docker Compose (Production)**:
  - Addressed build-time constraints for frontend application (adding dynamic ARGs for `VITE_API_URL` and `VITE_WS_URL`).
  - Implemented `CORS_ORIGIN` injection into API configuration.
  - Successfully extracted Queue processing into a dedicated `worker` container orchestrating BullMQ workers off the API instance. 
  
## Next Steps
- Provide `POSTGRES_PASSWORD`, `JWT_SECRET`, `FIRMS_MAP_KEY`, `CORS_ORIGIN`, `VITE_API_URL`, and `VITE_WS_URL` via `.env` file.
- Deploy the cluster via `docker-compose -f docker-compose.prod.yml up -d --build`.
- Run production database migrations.
- E2E application test validation.