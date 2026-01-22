import { signOut } from "next-auth/react";

export async function logout(idToken: string) {
  const logoutUrl =
    `http://localhost:8080/realms/my-realm/protocol/openid-connect/logout` +
    `?id_token_hint=${idToken}` +
    `&post_logout_redirect_uri=http://localhost:3000/authentication/login`;

  await signOut({ redirect: false });

  window.location.href = logoutUrl;
}
