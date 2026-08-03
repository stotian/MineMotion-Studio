# Signing and notarization

Signing secrets must exist only in protected CI environments with least privilege and environment protection. Never commit certificates, Apple API keys, passwords, private signing keys, or decoded secrets.

Windows candidates require Authenticode validation after signing. macOS candidates require hardened runtime signing, notarization, stapling, and Gatekeeper verification. Linux packages require published checksums; repository signing is separate from application packaging.

Unsigned development artifacts must be labelled unsigned and must never be promoted to stable.
