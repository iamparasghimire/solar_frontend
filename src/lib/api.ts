const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

type Primitive = string | number | boolean;

function toQueryString(params: Record<string, Primitive | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = payload?.detail || "Request failed";
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return payload as T;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  category: string;
  price: string | number;
  discount_percent: string | number;
  discounted_price: string | number;
  capacity: string;
  warranty_years: number;
  brand: string;
  is_featured: boolean;
  primary_image: string | null;
  average_rating: number;
  review_count: number;
  in_stock: boolean;
}

interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export async function fetchCategories() {
  return request<Category[]>("/api/products/categories/");
}

export async function fetchProducts(params: {
  search?: string;
  categorySlug?: string;
}) {
  const query = toQueryString({
    search: params.search,
    "category__slug":
      params.categorySlug && params.categorySlug !== "all"
        ? params.categorySlug
        : undefined,
  });
  const suffix = query ? `?${query}` : "";
  return request<PaginatedProducts>(`/api/products/${suffix}`);
}

export async function addToCart(payload: {
  productId: string;
  quantity?: number;
  includeInstallation?: boolean;
  accessToken: string;
}) {
  return request("/api/orders/cart/add/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${payload.accessToken}`,
    },
    body: JSON.stringify({
      product: payload.productId,
      quantity: payload.quantity ?? 1,
      include_installation: payload.includeInstallation ?? false,
    }),
  });
}

export async function submitContact(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return request<{ detail: string }>("/api/contacts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function subscribeNewsletter(email: string) {
  return request<{ detail: string }>("/api/contacts/newsletter/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
