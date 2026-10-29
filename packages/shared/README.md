# Shared contracts boundary

Reserved for small contracts genuinely needed by multiple npm workspaces. There is no package or shared runtime module yet; npm will recognize this directory only after a real package is introduced. Keep server secrets, worker dependencies and browser-unsafe code out of future shared exports; [ARCHITECTURE](../../docs/ARCHITECTURE.md) owns API contracts.
