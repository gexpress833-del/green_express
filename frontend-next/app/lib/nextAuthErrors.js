/** Messages lisibles pour les codes d’erreur NextAuth (?error= sur /login). */
const MESSAGES = {
  Configuration: 'Connexion Google mal configurée (vérifiez NEXTAUTH_URL, GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET).',
  AccessDenied: 'Accès refusé par Google. Vérifiez que votre compte est autorisé (mode test OAuth).',
  Verification: 'Lien de vérification expiré ou invalide.',
  OAuthSignin: 'Impossible de démarrer la connexion Google.',
  OAuthCallback:
    'Échec au retour Google : vérifiez GOOGLE_CLIENT_SECRET (code GOCSPX-…, pas le Client ID) et l’URI de redirection http://localhost:3000/api/auth/callback/google dans Google Cloud.',
  OAuthCreateAccount: 'Impossible de créer le compte OAuth.',
  EmailCreateAccount: 'Impossible de créer le compte avec cet e-mail.',
  Callback: 'Erreur lors du retour de connexion.',
  OAuthAccountNotLinked: 'Cet e-mail est déjà lié à une autre méthode de connexion. Utilisez e-mail / mot de passe.',
  SessionRequired: 'Veuillez vous connecter pour continuer.',
  Default: 'Connexion Google impossible. Réessayez.',
}

export function messageForNextAuthError(code) {
  if (!code || typeof code !== 'string') return ''
  return MESSAGES[code] || MESSAGES.Default
}
