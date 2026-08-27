# Checklist de mise en production

Chaque case est une condition réelle. Si elle n'est pas satisfaite, rester en
mode FREE et ne pas activer l'offre payante.

## 1. Décisions commerciales

- [ ] Définir les droits exacts de FREE, TRIAL, PREMIUM, PRO et ENTERPRISE.
- [ ] Définir le prix, la TVA, les renouvellements et le droit de rétractation.
- [ ] Publier CGU, politique de confidentialité et procédure de support.
- [ ] Définir la durée de trial, de lease hors ligne et la règle de reset
      d'appareil.

## 2. Service de licences séparé

- [ ] Créer un dépôt/service privé séparé de l'application.
- [ ] Déployer PostgreSQL, sauvegardes chiffrées, supervision et accès admin
      MFA.
- [ ] Configurer HTTPS, domaine, rate limiting et journal d'audit à rétention
      limitée.
- [ ] Implémenter toutes les routes de `SERVER_CONTRACT.md` avec validation
      stricte et tests d'intégration.
- [ ] Prévoir une table `licenses`, `devices`, `leases`, `nonces` et
      `audit_events`; indexer licence, appareil et date d'expiration.

## 3. Clés de signature

- [ ] Générer une paire Ed25519 dans un coffre-fort/gestionnaire de secrets,
      hors du dépôt et hors du poste de développement ordinaire.
- [ ] Donner à la clé un `keyId` daté, par exemple `prod-2026-01`.
- [ ] Mettre uniquement la clé publique base64url dans
      `src/licensing/LicensePublicKeys.ts`.
- [ ] Ajouter un test avec un certificat signé par une clé de test distincte.
- [ ] Ajouter une seconde clé publique avant toute rotation ; ne supprimer
      l'ancienne qu'après expiration des leases qu'elle a signées.
- [ ] Interdire toute clé privée dans `.env.example`, Git, CI, logs ou tickets.

## 4. Application desktop

- [ ] Ajouter un adaptateur de coffre-fort OS via Tauri pour `installationId`,
      lease et dernière heure fiable.
- [ ] Ajouter un écran Réglages → Licence : activation, état, appareils,
      désactivation et diagnostic sans afficher la clé complète.
- [ ] Centraliser le contrôle de droits autour des opérations réelles : exports,
      résolution et fonctionnalités de production. Ne pas cacher seulement des
      boutons.
- [ ] Garantir que les projets restent lisibles quand une licence expire.
- [ ] Fournir une restauration FREE claire, sans perte ni destruction de
      contenu.
- [ ] Signer les binaires de release et tester la mise à jour.

## 5. Validation sécurité

- [ ] Tests : signature invalide, clé inconnue, droits modifiés, expiration,
      version, appareil, nonce rejoué et retour d'horloge.
- [ ] Test d'intégration : activation → offline → renouvellement →
      désactivation → réactivation.
- [ ] Test de charge/rate limiting et revue des erreurs API.
- [ ] Audit indépendant du backend, de la gestion des secrets et des paiements.
- [ ] Vérifier que les logs excluent clé de licence complète, e-mail inutile,
      token, clé privée, cookie et projet utilisateur.

## 6. Passage en vente

- [ ] Créer des licences internes de test et effectuer un achat de bout en bout
      en environnement de préproduction.
- [ ] Tester le support : changement de machine, perte d'accès, remboursement,
      révocation et récupération hors ligne.
- [ ] Valider les installateurs signés, les preuves CI et le jalon publication.
- [ ] Autoriser seulement alors la clé publique de production dans une release.

## Commandes de vérification de l'application

```powershell
npm run typecheck
npm test -- --run src/licensing
npm test -- --run
npm run build
npm audit
```
