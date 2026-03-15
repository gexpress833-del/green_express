# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - heading "Green Express" [level=1] [ref=e6]
    - paragraph [ref=e7]: Bienvenue
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: Email
        - textbox "votre@email.com" [ref=e10]
      - generic [ref=e11]:
        - text: Mot de passe
        - textbox "••••••••" [ref=e12]
      - button "Se connecter" [ref=e13]
    - paragraph [ref=e15]:
      - text: Pas encore inscrit?
      - link "Créer un compte" [ref=e16] [cursor=pointer]:
        - /url: /register
  - contentinfo [ref=e17]:
    - generic [ref=e18]: © 2026 Green Express
  - alert [ref=e19]
```