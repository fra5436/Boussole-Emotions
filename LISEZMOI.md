# Boussole des émotions — PWA

Référentiel des émotions + journal de saisies. Thème clair par défaut, thème sombre
dans Réglages. **Aucune donnée ne sort de l'appareil**, et **aucune connexion n'est
nécessaire après la première ouverture**.

## Déposer sur Netlify

Ne décompressez pas. Sur https://app.netlify.com/drop, déposez **le fichier .zip
lui-même** : Netlify le décompresse et publie son contenu à la racine du site.

Si vous obtenez « Page Not Found », c'est que l'archive contenait un dossier parent :
rezippez le contenu, pas le dossier.

## Hors ligne — comment vérifier

La toute première ouverture exige une connexion : c'est à ce moment que le navigateur
télécharge et met en cache l'application. Ensuite, plus jamais.

Réglages affiche un voyant :

| Voyant | Sens |
|---|---|
| Vert — « Prêt pour le hors ligne » | Tout est en cache, la connexion peut disparaître |
| Orange — « Mise en cache en cours » | Restez connecté quelques secondes, puis « Revérifier » |
| Rouge | Service worker non enregistré : rechargez en étant connecté |

Attendez le voyant vert **avant** de tester en mode avion.

Le mode hors ligne exige **HTTPS** : il ne fonctionne pas si vous ouvrez `index.html`
directement depuis le disque (`file://`). L'application reste alors utilisable, mais
sans installation ni cache — Réglages l'indique.

### Situations couvertes

Une fois le voyant au vert, ces quatre cas ont été testés et fonctionnent :

- réseau coupé (mode avion) ;
- **site désactivé ou supprimé sur Netlify** ;
- site désactivé *puis* réseau coupé ;
- retour à la normale, sans perte de saisies.

Le point clé : l'application est servie depuis le cache **avant** toute tentative
réseau, et une réponse d'erreur du serveur n'est jamais mise en cache. Un hébergeur
qui répond « Site not found » ne peut donc plus remplacer l'application.

Le stockage est marqué persistant quand le navigateur l'accorde, pour que le cache et
les saisies ne soient pas évincés en cas de manque de mémoire. Réglages indique si
c'est le cas.

## Installation sur téléphone

Réglages → « Installer l'application ». Le bouton n'apparaît que si le navigateur
propose l'installation (Chrome/Edge). Sur iOS, Safari n'expose pas d'installation
programmatique : Partager → « Sur l'écran d'accueil ».

## Cartes corporelles

Chaque émotion porte une carte d'activation bipolaire :

- **couleurs chaudes** — régions dont l'activité augmente ;
- **couleurs froides** — régions dont l'activité diminue.

Les cartes de colère, tristesse, peur, joie, surprise, dégoût et honte transposent les
topographies publiées dans Nummenmaa, Glerean, Hari & Hietanen, *Bodily maps of
emotions*, PNAS 2014 (doi 10.1073/pnas.1321664111).

**Culpabilité et intérêt ne figurent pas dans cette étude.** Leurs cartes sont
extrapolées à partir de la colonne « Sensations » du référentiel papier et des
émotions voisines. L'application le signale sous la mention « Carte : extrapolé ».
À faire valider par le psychologue avant tout usage clinique.

Les valeurs par zone sont dans `REFERENTIEL[].zones`, de −1 (activité qui diminue) à
+1 (activité qui augmente) ; les coordonnées sont dans `ZONES` (viewBox 100 × 240).

## Contenu de l'archive

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application : données, styles et logique |
| `manifest.webmanifest` | Nom, icônes, couleurs, mode plein écran |
| `sw.js` | Service worker, cache hors ligne |
| `icons/` | Icônes 192, 512 et 512 masquable |

## Modifier le référentiel

En haut du `<script>` de `index.html` : `REFERENTIEL` (les neuf émotions), `ZONES`
(les 13 régions du corps), `INTRO` (la page « Une émotion, qu'est-ce que c'est ? »).

## Publier une mise à jour

Incrémenter `VERSION` dans `sw.js` (`v4` → `v5`), sinon les appareils déjà installés
continueront de servir l'ancienne version depuis le cache. Les anciens caches ne sont
purgés qu'une fois le nouveau correctement rempli : une mise à jour tentée pendant une
panne du serveur ne peut pas laisser un appareil sans application.

## Format des données

```json
{
  "id": "uuid",
  "ts": "2026-08-18T07:48:00.000Z",
  "emotion": "peur",
  "nuance": "Angoisse",
  "intensite": 5,
  "situation": "…",
  "sensations": "…",
  "pensees": "…",
  "comportements": "…"
}
```

L'export produit `{ "appli": "boussole-emotions", "version": 1, "saisies": [...] }`.
L'import fusionne sans écraser : les `id` déjà présents sont ignorés.
