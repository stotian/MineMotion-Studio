# Système de licences MineMotion Studio

## Position produit

MineMotion conserve un niveau **FREE** utilisable sans compte. TRIAL, PREMIUM,
PRO et ENTERPRISE ajoutent des droits explicites. Le modèle retient les idées
utiles de Blender (accès de base durable), FL Studio (éditions lisibles) et
Adobe (activation et appareils), sans reproduire leurs licences ni services.

Aucun programme local ne peut être impossible à cracker. L'objectif est de
protéger les utilisateurs honnêtes, rendre la falsification coûteuse et gérer
les abus proprement ; jamais de supprimer, chiffrer ou rendre les projets
inaccessibles.

## Architecture

```text
Application MineMotion                   Service de licences
  clé publique Ed25519  <--- certificat --- clé privée Ed25519 (secret)
  installationId local  --- activation --> appareils, révocation, journal
  lease cache signée    <--- renouvellement - expiration
```

- Le serveur conserve une clé privée **Ed25519** ; l'application reçoit
  uniquement une clé publique rotative, repérée par `keyId`.
- Le certificat signe des revendications canoniques : licence, produit,
  édition, client pseudonymisé, dates, droits, appareils, versions, nonce et
  liaison optionnelle à l'installation.
- Le client vérifie la signature avant de lire les droits. Un JSON modifié ne
  devient donc pas une licence.
- La fondation source contient le vérificateur et les tests. Aucune clé de
  production n'est encore inscrite : elle doit être créée hors dépôt avec le
  futur serveur.

## Éditions et droits

| Édition | Durée | Appareils | Usage |
| --- | --- | ---: | --- |
| FREE | permanente | 1 installation | Édition de base |
| TRIAL | expiration signée | 1 | Évaluation |
| PREMIUM | permanente ou abonnement | 2 | Export sans filigrane |
| PRO | permanente ou abonnement | 2 | Production haute définition |
| ENTERPRISE | contrat | configuré | Équipes et support |

Les droits sont stables et signés : `watermark-free-export`,
`high-resolution-export`, `production-workspaces`, `commercial-use`,
`team-seats`, `priority-support`. Le serveur est l'autorité, jamais un bouton
masqué dans l'interface.

## Activation, appareils et hors ligne

1. L'application crée un `installationId` aléatoire, à stocker dans le coffre
   OS du runtime desktop. Aucun numéro de série matériel agressif n'est relevé.
2. `POST /v1/licenses/activate` transmet la clé de licence, un challenge court,
   le hachage de l'installation et la version, via HTTPS.
3. Le serveur vérifie la limite d'appareils, consomme le challenge, journalise
   l'événement et renvoie un certificat/lease signé, lié à l'installation.
4. Hors ligne, le client vérifie la signature et une lease courte (14 jours est
   un départ raisonnable). Il garde la dernière heure fiable : un recul évident
   de l'horloge désactive les droits premium jusqu'au contrôle en ligne.
5. Une expiration ou révocation désactive seulement les fonctions premium. Les
   projets restent lisibles et exportables dans les limites FREE.

Une réinitialisation d'appareil authentifiée est prévue côté support. Cette
stratégie est plus fiable et respectueuse qu'un fingerprint matériel fragile.

## API serveur proposée

| Route | Rôle |
| --- | --- |
| `POST /v1/licenses/activate` | Associe une installation et émet une lease. |
| `POST /v1/licenses/refresh` | Renouvelle une lease avec challenge anti-rejeu. |
| `POST /v1/licenses/deactivate` | Libère une installation volontairement. |
| `POST /v1/licenses/validate` | Vérifie en ligne et renvoie une révocation. |
| `POST /v1/licenses/device-reset` | Réinitialisation support authentifiée. |
| `POST /v1/admin/licenses` | Création/révocation/audit, strictement back-office. |

Chaque route impose TLS, validation d'entrées, rate limiting, nonces courts,
identifiants de requête et journal d'audit minimal. Les clés de paiement et la
clé privée ne quittent jamais le backend.

## Résistance et limites

- Signer les installateurs, contrôler les mises à jour signées et répartir les
  contrôles de droits sur les opérations premium réelles.
- Une obfuscation de release peut augmenter le coût d'un patch ; elle n'est pas
  une frontière de sécurité. Les signatures et le serveur restent l'autorité.
- Le stockage navigateur n'est qu'une compatibilité. Avant vente, Tauri doit
  utiliser le coffre-fort Windows/macOS/Linux.
- Toute détection est non destructive : message, contrôle en ligne, et retour
  aux droits FREE. Aucun comportement hostile ou collecte cachée.

## Préparation commerciale

1. Déployer le backend séparément : PostgreSQL, sauvegardes, secrets gérés,
   rotation de clés et audit.
2. Générer la clé Ed25519 hors dépôt ; publier seulement sa clé publique dans
   `src/licensing/LicensePublicKeys.ts`.
3. Ajouter coffre-fort OS, écran d'activation, compte client et support.
4. Faire auditer sécurité, CGU, confidentialité, TVA/abonnements et procédure
   de réinitialisation d'appareil avant toute vente.

Le guide d'exécution autonome se trouve dans
[`docs/licensing/`](licensing/README.md).
