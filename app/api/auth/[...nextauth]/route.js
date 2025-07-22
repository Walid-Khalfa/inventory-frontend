import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Strapi",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Journalisation pour débogage
          console.log('Tentative d\'autorisation avec:', credentials);
          
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                identifier: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await res.json();
          console.log('Réponse de Strapi:', { status: res.status, data });
          
          if (!res.ok || !data.jwt) {
            const errorMsg = data.error?.message || data.message || "Login failed";
            console.error("Erreur d'authentification Strapi:", errorMsg);
            throw new Error(errorMsg);
          }

          return {
            id: data.user.id,
            name: data.user.username,
            email: data.user.email,
            jwt: data.jwt,
          };
        } catch (error) {
          console.error("Erreur dans authorize:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate[0]=firstName&populate[1]=lastName`,
          {
            headers: {
              Authorization: `Bearer ${user.jwt}`,
            },
          }
        );
        const userData = await userResponse.json();

        console.log("User data from Strapi:", JSON.stringify(userData, null, 2));

        token.jwt = user.jwt;
        token.id = user.id;
        token.firstName = userData.firstName;
        token.lastName = userData.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        firstName: token.firstName,
        lastName: token.lastName,
      };
      session.jwt = token.jwt;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };