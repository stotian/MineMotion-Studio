# Contrat du serveur de licences

## Principes non négociables

- HTTPS uniquement ; toutes les entrées sont bornées et validées.
- La clé privée Ed25519 est disponible uniquement au service de signature.
- Un nonce de requête est aléatoire, stocké côté serveur, à usage unique et
  expire rapidement (par exemple 5 minutes).
- Les identifiants client sont pseudonymisés ; le hash d'installation est un
  hash stable du secret local, pas un inventaire matériel.
- Les erreurs sont minimales : ne pas révéler si une clé appartient à un autre
  client ni les détails d'administration.

## Certificat signé

Le serveur signe exactement la forme JSON canonique suivante :

```json
{
  "format": 1,
  "claims": {
    "licenseId": "lic_xxx",
    "productId": "minemotion-studio",
    "edition": "PRO",
    "customerId": "cus_pseudonymous",
    "issuedAt": "2026-01-01T00:00:00.000Z",
    "expiresAt": null,
    "features": ["basic-editor", "high-resolution-export"],
    "maxDevices": 2,
    "minVersion": "0.8.2",
    "maxVersion": null,
    "installationIdHash": "base64url_hash",
    "nonce": "unique_lease_nonce"
  }
}
```

Les clés JSON sont triées récursivement comme dans `canonicalize` de
`src/licensing/LicenseVerifier.ts`, encodées UTF-8, puis signées Ed25519. La
réponse ajoute :

```json
{
  "signature": {
    "algorithm": "Ed25519",
    "keyId": "prod-2026-01",
    "value": "base64url_signature"
  }
}
```

Ne pas signer un objet dont le serveur n'a pas contrôlé tous les champs.

## Routes publiques

### `POST /v1/licenses/activate`

Entrée : clé de licence, `installationIdHash`, version, nonce/challenge.

Contrôles : normalisation de clé, statut, expiration, produit, version, limite
d'appareils, nonce non réutilisé et rate limit. Sortie : lease signée avec durée
courte, jamais un secret serveur.

### `POST /v1/licenses/refresh`

Entrée : lease actuelle, hash installation, nouveau challenge. Le serveur
vérifie la signature, la révocation, l'appareil, la date et le nonce, puis émet
une nouvelle lease. Une ancienne réponse ne doit pas prolonger l'accès.

### `POST /v1/licenses/deactivate`

Entrée : lease signée et challenge. Libère uniquement l'appareil correspondant,
journalise l'action et invalide la lease associée.

### `POST /v1/licenses/validate`

Entrée : lease et challenge. Sortie : état minimal et, si nécessaire, lease
renouvelée. Cette route sert aux contrôles périodiques et à la révocation.

## Routes administratives

Elles ne partagent pas l'authentification client : back-office séparé, MFA,
RBAC, journal immuable et double validation pour révocation/édition
ENTERPRISE. `POST /v1/admin/licenses` crée ou modifie une licence ; une
révocation produit une entrée horodatée et invalide la prochaine validation.
