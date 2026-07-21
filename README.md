# AI Drone Delivery Last-Mile

The supported backend boundary is `/api/governed-missions`: tenant-scoped mission plans, deterministic recorded safety checks, expiring source snapshots, separate administrator approval, operator release, telemetry, contingencies, and external outcome recording. It cannot command aircraft or authorize airspace.

Copy `.env.example` to `.env`. Migrate and bootstrap only through the explicit guarded backend scripts. `./start.sh` is nondestructive and legacy demo routes are disabled by default.

Fleet/autopilot, maps, weather, airspace, Remote ID, field testing, operational approval, signed-record infrastructure, and regulatory validation remain external blockers.
