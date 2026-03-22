# Security Policy

## Supported Versions

Only the latest published version is supported for security fixes.

## Reporting a Vulnerability

Please report security vulnerabilities privately via GitHub Security Advisories for this repository.

- Do not open public issues for exploitable details.
- Include reproduction steps and affected version.
- Include suggested mitigation if available.

## Security Controls in This Repository

- Release pipeline publishes only from `main`.
- Automatic release uses npm provenance (`npm publish --provenance`).
- CI enforces lint, typecheck, tests, build, and production dependency audit.
- Release workflow skips duplicate npm versions.
- CLI initializer validates package names and prevents writes outside target directory.
- Runtime submission validates API endpoint scheme and sanitizes message content.

## Consumer Best Practices

- Always provide an HTTPS complaint endpoint in production.
- Validate and sanitize payloads server-side.
- Apply authentication, rate limiting, and anti-abuse controls on backend APIs.
- Do not rely on client-side validation alone.
