export type Tool = {
  tool_id: string;
  tool_name: string;
  description: string;
  thumbnail_url: string;
  tool_url: string;
  manual_url: string;
  required_credit: number;
  is_active: boolean;
  category: string;
  sort_order: number;
  button_text: string;
  tags: string[];
  created_at: string;
};

export type ToolsFetchResult =
  | { success: true; tools: Tool[] }
  | { success: false; error: string };
