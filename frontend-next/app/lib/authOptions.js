import GoogleProvider from 'next-auth/providers/google'

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

if (
  process.env.NODE_ENV === 'development' &&
  googleClientId &&
  googleClientSecret &&
  googleClientSecret === googleClientId
) {
  console.error(
    '[NextAuth] GOOGLE_CLIENT_SECRET ne doit pas être identique à GOOGLE_CLIENT_ID. Utilisez le « Code secret du client » (GOCSPX-…).',
  )
}

if (!googleClientId || !googleClientSecret) {
  console.error('[NextAuth] Variables Google manquantes:', {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
  })
}

/** @type {import('next-auth').NextAuthOptions} */
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 10 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'google' && account.id_token) {
        token.googleIdToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      if (token.googleIdToken) {
        session.googleIdToken = token.googleIdToken
      }
      return session
    },
  },
}
