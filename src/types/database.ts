export type Profile = {
  id: string;
  username: string;
  email: string;
  credit: number;
  created_at: string;
};

export type Tool = {
  id: string;
  tool_key: string;
  tool_name: string;
  description: string | null;
  category: string | null;
  tool_url: string | null;
  credit_cost: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type UserFavoriteTool = {
  id: string;
  user_id: string;
  tool_id: string;
  created_at: string;
};

export type CheckoutRequestBody = {
  userId: string;
  email: string;
  username: string;
  addCredit: number;
  amount: number;
  currency: string;
  productName: string;
  termsAccepted: boolean;
  cancelPolicyAccepted: boolean;
};

export type N8nCheckoutPayload = {
  userId: string;
  email: string;
  username: string;
  addCredit: number;
  amount: number;
  currency: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  timestamp: string;
};

export type CheckoutResponseBody = {
  checkoutUrl?: string;
  url?: string;
};
