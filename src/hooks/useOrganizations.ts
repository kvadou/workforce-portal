import { useQuery } from "@tanstack/react-query";

export type Organization = {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
  isHQ: boolean;
  isActive: boolean;
  createdAt?: string;
  _count?: {
    users: number;
  };
};

// Fetch all organizations
async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch("/api/organizations");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch organizations");
  }
  const data = await response.json();
  return data.organizations;
}

// Hooks
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
  });
}

// Hook to get active organizations only
export function useActiveOrganizations() {
  const query = useOrganizations();

  return {
    ...query,
    data: query.data?.filter(org => org.isActive),
  };
}
