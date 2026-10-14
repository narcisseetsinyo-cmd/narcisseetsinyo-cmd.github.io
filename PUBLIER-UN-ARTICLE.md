# Publier un article sur le blog

Chaque article est un simple fichier texte dans le dossier `_posts`. Le site se met à jour tout seul 1 à 2 minutes après l'enregistrement.

## 1. (Facultatif) Ajouter une photo

1. Ouvrez le dossier `assets/img/blog` sur GitHub.
2. Cliquez sur **Add file → Upload files**, glissez votre photo, puis **Commit changes**.
3. Donnez à la photo un nom simple, sans espaces ni accents, par exemple `congres-panafricain.jpg`.
   Format conseillé : JPG, environ 1600 px de large, moins de 500 Ko.

## 2. Créer l'article

1. Ouvrez le dossier `_posts`, puis cliquez sur **Add file → Create new file**.
2. Nommez le fichier ainsi : `AAAA-MM-JJ-titre-sans-accents.md`
   Exemple : `2026-10-20-mon-reportage-au-congres.md`
   La date du nom est la date de publication affichée sur le site.
3. Copiez le modèle ci-dessous, remplissez-le, puis cliquez sur **Commit changes**.

```
---
layout: post
title: "Titre de l'article"
categorie: Photographie
image: /assets/img/blog/nom-de-la-photo.jpg
resume: "Une ou deux phrases qui donnent envie de lire l'article."
---

Premier paragraphe de l'article.

## Un intertitre

Texte du paragraphe. Pour mettre un mot en **gras**, entourez-le de deux étoiles.

![Description de la photo](/assets/img/blog/autre-photo.jpg)

- Un point de liste
- Un autre point

> Une citation mise en valeur.
```

- `categorie` : choisissez par exemple Photographie, Graphisme, Communication ou Actualités. Les catégories servent de filtres sur la page Blog.
- `image` : la photo de couverture. Supprimez la ligne si l'article n'a pas de photo.
- `resume` : le court texte affiché sur les cartes d'articles et lors des partages.

## Modifier ou supprimer un article

Ouvrez le fichier dans `_posts`, cliquez sur le crayon pour le modifier ou sur les trois points puis **Delete file** pour le supprimer.
