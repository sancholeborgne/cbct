# Orientation CBCT

Application Flask légère pour rejouer l’arbre de décision du PDF fourni et produire un compte rendu simple à transmettre au praticien.

## Lancer le projet

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 run.py
```

Puis ouvrir `http://127.0.0.1:5000`.

Si le port `5000` est déjà occupé :

```bash
PORT=5001 python3 run.py
```

## Structure

- `run.py` : point d’entrée local.
- `app/` : application Flask.
- `app/screening/routes.py` : blueprint principal.
- `app/static/js/decision-tree.js` : arbre de décision encodé en données.
- `app/static/js/app.js` : logique de l’interface et génération du compte rendu.
- `app/static/css/styles.css` : interface bento / glassmorphism noir et blanc avec thème clair / sombre.

## Note de modélisation

Le PDF contient deux commentaires internes sur la branche des molaires maxillaires initiales (`stade de Nolla` et `item apex ouvert`). Ils ont été traités comme notes d’aide et non comme questions patient supplémentaires afin de garder le parcours simple et fidèle au schéma exploitable.
