# Testing Notes

- Backend: run `npm test` inside `backend/` to execute Jest unit tests (`*.spec.ts`).
- Frontend: run `npm test` inside `frontend/` to execute Vitest suites.
- Gateway: run integration smoke tests by piping sample payloads from `jt808-service/testdata/` using `nc localhost 6808 < sample.hex`.
- Maintain ≥80% line coverage; document exceptions here with rationale and follow-up owners.
