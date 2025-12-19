import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertUser, type User } from "@shared/schema";
import { z } from "zod";

// Fetch user by ID
export function useUser(id: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create new user
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const validated = api.users.create.input.parse(data);
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.users.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create user");
      }
      return api.users.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // In a real app, we might set session here or invalid auth queries
    },
  });
}

// Update user profile (demographics/preferences)
type UpdateProfileInput = z.infer<typeof api.users.updateProfile.input>;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProfileInput }) => {
      const validated = api.users.updateProfile.input.parse(data);
      const url = buildUrl(api.users.updateProfile.path, { id });
      
      const res = await fetch(url, {
        method: api.users.updateProfile.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("User not found");
        throw new Error("Failed to update profile");
      }
      return api.users.updateProfile.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, data.id] });
    },
  });
}
