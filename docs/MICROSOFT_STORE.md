# Publication desktop et Microsoft Store

MineMotion Studio est une application **desktop native** construite avec Tauri
(moteur natif + WebView2), comme un vrai logiciel installable de type Blender.
Ce document décrit ce qui est **automatisé dans le dépôt** et ce qui reste
**à faire de ton côté** (comptes et identité externes que je ne peux pas créer).

## 1. Installateur téléchargeable (automatisé)

Le workflow `.github/workflows/desktop.yml` construit l'application sur un runner
Windows dans le cloud — là où aucune politique Smart App Control ne bloque les
scripts de compilation Rust — et publie les installateurs `.msi` et `.exe` en
artefacts téléchargeables.

- Déclenchement manuel : onglet **Actions → Desktop build → Run workflow**, ou
  `gh workflow run desktop.yml --ref main`.
- Déclenchement automatique : sur un tag `v*` (ex. `v0.9.0`).
- Récupération : ouvrir le run terminé et télécharger l'artefact
  `minemotion-windows-installers`.

Le build local direct (`npm run tauri:build`) échoue sur ta machine à cause de
**Smart App Control** (`os error 4551` : « stratégie de contrôle d'application a
bloqué ce fichier »). C'est un réglage de sécurité Windows, pas un défaut du
code. Le CI cloud contourne ce blocage sans rien modifier sur ton PC.

## 2. Paquet Microsoft Store (MSIX) — étapes requises

Le Store n'accepte pas les `.msi`/`.exe` : il faut un paquet **MSIX** dont
l'identité correspond à un compte éditeur. Ces éléments dépendent d'un compte
externe et doivent être fournis avant d'automatiser la génération MSIX.

À faire de ton côté :

1. **Créer un compte Microsoft Partner Center** (programme Windows & Store).
   Compte individuel : frais uniques d'environ 19 USD.
2. **Réserver le nom de l'application** « MineMotion Studio » dans Partner Center
   (Applications et jeux → Nouveau produit → Application MSIX/PWA).
3. Récupérer l'**identité du paquet** fournie par Partner Center :
   - `Package/Identity/Name` (ex. `1234Publisher.MineMotionStudio`)
   - `Publisher` (ex. `CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)
   - `Publisher display name`
4. Me transmettre ces trois valeurs. J'ajouterai alors un manifeste
   `AppxManifest.xml` et une étape CI (`makeappx` du Windows SDK) pour produire
   le `.msix` à partir de l'app déjà construite.
5. **Soumettre** le `.msix` dans Partner Center. La signature finale est assurée
   par le Store à la soumission (pas besoin d'un certificat payant pour le Store ;
   un certificat ne serait nécessaire que pour une distribution hors Store).

## 3. Assets de publication

Les icônes Tauri existent déjà dans `src-tauri/icons/`. Le Store demande des
visuels supplémentaires (captures d'écran, logo Store 300×300, description,
classification d'âge). Ce sont des éléments de fiche produit à préparer dans
Partner Center, sans impact sur le code.

## 4. Statut honnête

- Chaîne de build native : **présente et exécutée en CI** (validation en cours).
- Installateurs `.msi`/`.exe` : produits par le CI cloud.
- MSIX / soumission Store : **en attente de l'identité Partner Center** (étape 2).
- Aucune revendication de publication tant que la soumission n'est pas acceptée.
