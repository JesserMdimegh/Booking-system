// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { JWT } from "next-auth/jwt";

async function syncUserToDatabase(userInfo: any, roles: string[]) {
  try {
    // Determine user type based on roles
    const isClient = roles.includes('Client') || roles.includes('client');
    const isProvider = roles.includes('Provider') || roles.includes('provider');
    
    if (isClient || isProvider) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/keycloak/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userInfo.preferred_username || userInfo.email.split('@')[0],
          email: userInfo.email,
          password: 'auto-generated', // This won't be used for Keycloak users
          userType: isClient ? 'client' : 'provider',
          services: isProvider ? [] : undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to sync user to database:', errorData);
      } else {
        console.log(`User ${userInfo.email} synced to database as ${isClient ? 'client' : 'provider'}`);
      }
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
  }
}

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Failed to refresh token", refreshedTokens);
      throw refreshedTokens;
    }

    // Decode the NEW access token to get updated roles
    const decodedToken = JSON.parse(
      Buffer.from(refreshedTokens.access_token.split('.')[1], 'base64').toString()
    );

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      roles: decodedToken.realm_access?.roles || [],
      clientRoles: decodedToken.resource_access?.[process.env.KEYCLOAK_CLIENT_ID!]?.roles || [],
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial login
      if (account && profile) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = Date.now() + (account.expires_at as number) * 1000;
        
        // ⚠️ IMPORTANT: Decode ACCESS token, not ID token
        // Roles are in the access_token, not id_token
        if (account.access_token) {
          const decodedToken = JSON.parse(
            Buffer.from(account.access_token.split('.')[1], 'base64').toString()
          );
          
          // Extract realm roles
          token.roles = decodedToken.realm_access?.roles || [];
          
          // Extract client-specific roles
          const clientId = process.env.KEYCLOAK_CLIENT_ID;
          token.clientRoles = decodedToken.resource_access?.[clientId!]?.roles || [];
          
          // Extract user info
          token.sub = decodedToken.sub;
          token.email = decodedToken.email;
          token.preferred_username = decodedToken.preferred_username;
          
          console.log("JWT Callback - Initial login:");
          console.log("Roles:", token.roles);
          console.log("Client Roles:", token.clientRoles);
          
          // Sync user to database if they have roles
          const allRoles = [...(token.roles || []), ...(token.clientRoles || [])];
          if (allRoles.length > 0) {
            // Use setTimeout to avoid blocking the JWT callback
            setTimeout(() => {
              syncUserToDatabase({
                sub: decodedToken.sub,
                email: decodedToken.email,
                preferred_username: decodedToken.preferred_username,
              }, allRoles);
            }, 0);
          }
        }
        
        return token;
      }

      // Token still valid
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // Token expired → refresh
      console.log("Token expired, refreshing...");
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // ⚠️ IMPORTANT: Pass roles to session
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.roles = token.roles as string[];
      session.clientRoles = token.clientRoles as string[];
      
      // Add user info
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.preferred_username as string;
      }
      
      console.log("Session Callback:");
      console.log("Roles:", session.roles);
      console.log("Client Roles:", session.clientRoles);
      
      return session;
    },
  },
  // ⚠️ ADD THIS: Configure logout behavior
  events: {
    async signOut({ token }) {
      // Log out from Keycloak
      if (token?.idToken) {
        try {
          const params = new URLSearchParams({
            id_token_hint: token.idToken as string,
            post_logout_redirect_uri: process.env.NEXTAUTH_URL!,
          });

          await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?${params.toString()}`,
            { method: "GET" }
          );
        } catch (error) {
          console.error("Error during Keycloak logout:", error);
        }
      }
    },
  },

  // ⚠️ ADD THIS: Custom pages
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };