# Opérations et support

## Création d'une licence

1. Vérifier paiement/contrat dans le système commercial, pas dans l'application.
2. Créer la licence avec édition, durée, appareils, versions et droits.
3. Ne stocker la clé de licence qu'en forme hachée côté base lorsque possible ;
   montrer la valeur complète une seule fois via un canal sûr.
4. Émettre le certificat uniquement au moment de l'activation, lié à
   l'installation et à la lease.
5. Journaliser création et activation sans loguer la clé complète.

## Changement de machine

1. Demander à l'utilisateur de désactiver depuis l'ancienne machine si possible.
2. Sinon, vérifier l'identité/achat via support.
3. Réinitialiser seulement l'appareil concerné, conserver l'audit et limiter les
   resets automatiques.
4. L'utilisateur active la nouvelle machine ; l'ancienne lease finit ou est
   révoquée.

## Révocation et incident

1. Révoquer côté serveur avec motif et opérateur dans l'audit.
2. Ne jamais bloquer l'ouverture ou la sauvegarde d'un projet utilisateur.
3. Lors du prochain contrôle, désactiver les droits premium et afficher la voie
   de support.
4. Pour une clé de signature compromise : ajouter une nouvelle clé publique à
   l'application, signer les nouvelles leases avec elle, réémettre les leases,
   puis retirer l'ancienne après la période de recouvrement.

## Incident de données ou de sécurité

1. Désactiver les identifiants administratifs compromis et tourner les secrets.
2. Préserver les journaux nécessaires, sans élargir la collecte utilisateur.
3. Évaluer la notification légale avec un conseil compétent.
4. Documenter l'incident, corriger, tester et publier une mise à jour signée.

## À ne jamais faire

- Ne jamais mettre une clé privée, une clé Stripe/PayPal ou un mot de passe dans
  Git, une issue, une capture d'écran ou un log.
- Ne jamais lier agressivement une licence au matériel ou collecter des données
  sans consentement.
- Ne jamais supprimer, chiffrer ou endommager des projets lors d'une expiration.
- Ne jamais annoncer une activation/paiement disponible avant le test complet
  préproduction et la revue juridique.
