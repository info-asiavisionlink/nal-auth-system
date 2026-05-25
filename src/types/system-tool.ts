export type SystemTool = {
  tool_id: string;
  tool_name: string;
  description: string;
  category: string;
  tags: string[];
  image_url: string;
  tool_url: string;
  document_url: string;
  credit_cost: number;
  is_active: boolean;
  sort_order: number;
};

export type SystemToolsFetchResult =
  | { success: true; tools: SystemTool[] }
  | { success: false; error: string };
