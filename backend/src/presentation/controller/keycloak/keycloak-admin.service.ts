import { Injectable, HttpException } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class KeycloakAdminService {
  private readonly baseUrl = process.env.KEYCLOAK_URL;
  private readonly realm = process.env.KEYCLOAK_REALM;

  async getAdminToken(): Promise<string> {
    try {
      console.log("Fetching Keycloak admin token...");
      const response = await axios.post(
        `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new HttpException(
        "Failed to fetch Keycloak admin token",
        500
      );
    }
  }
  async createUser(user: {
    username: string;
    email: string;
    password: string;
  }) {

    const token = await this.getAdminToken();

    try {
      console.log("Creating user in Keycloak...");
      await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/users`,
        {
          username: user.username,
          email: user.email,
          enabled: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("User created, setting password...");
      const users = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users?username=${user.username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userId = users.data[0].id;
      console.log("Setting password for user in Keycloak...");
      await axios.put(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/reset-password`,
        {
          type: "password",
          value: user.password,
          temporary: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Return user info including ID
      return {
        id: userId,
        username: user.username,
        email: user.email
      };

    } catch (error) {
      console.error("Keycloak create user error:");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
      } else {
        console.error("Error message:", error.message);
      }

      throw new HttpException(
        error.response?.data || "Failed to create user",
        error.response?.status || 500
      );
    }

  }

  async createRole(roleName: string) {
    const token = await this.getAdminToken();
    
    try {
      await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/roles`,
        {
          name: roleName,
          description: `Role: ${roleName}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return { message: `Role '${roleName}' created successfully` };
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Failed to create role",
        error.response?.status || 500
      );
    }
  }

  async assignRoleToUser(username: string, roleName: string) {
    const token = await this.getAdminToken();
    
    try {
      // Get user ID
      const usersResponse = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users?username=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (usersResponse.data.length === 0) {
        throw new HttpException("User not found", 404);
      }
      
      const userId = usersResponse.data[0].id;
      
      // Get role
      const rolesResponse = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/roles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const role = rolesResponse.data.find((r: any) => r.name === roleName);
      if (!role) {
        throw new HttpException("Role not found", 404);
      }
      
      // Assign role to user
      await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        [role],
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return { message: `Role '${roleName}' assigned to user '${username}' successfully` };
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Failed to assign role to user",
        error.response?.status || 500
      );
    }
  }

  async getUsers() {
    const token = await this.getAdminToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        enabled: user.enabled,
        createdTimestamp: user.createdTimestamp,
      }));
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Failed to get users",
        error.response?.status || 500
      );
    }
  }

  async getRoles() {
    const token = await this.getAdminToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/roles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Failed to get roles",
        error.response?.status || 500
      );
    }
  }

}
