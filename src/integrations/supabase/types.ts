export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      item_media: {
        Row: {
          created_at: string | null
          file_path: string
          file_type: string
          id: string
          item_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_type: string
          id?: string
          item_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_type?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_media_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          buyer_id: string | null
          category: string
          condition: string
          created_at: string | null
          current_branch: string | null
          final_payout: number | null
          id: string
          payout_method: string | null
          processed_at: string | null
          processed_by: string | null
          recycle_cost: number | null
          repair_cost: number | null
          scrap_cost: number | null
          seller_eth_address: string | null
          seller_id: string
          seller_quoted_price: number
          selling_price: number | null
          status: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          category: string
          condition: string
          created_at?: string | null
          current_branch?: string | null
          final_payout?: number | null
          id?: string
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          recycle_cost?: number | null
          repair_cost?: number | null
          scrap_cost?: number | null
          seller_eth_address?: string | null
          seller_id: string
          seller_quoted_price: number
          selling_price?: number | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          category?: string
          condition?: string
          created_at?: string | null
          current_branch?: string | null
          final_payout?: number | null
          id?: string
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          recycle_cost?: number | null
          repair_cost?: number | null
          scrap_cost?: number | null
          seller_eth_address?: string | null
          seller_id?: string
          seller_quoted_price?: number
          selling_price?: number | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_items_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          blockchain_tx_hash: string | null
          completed_at: string | null
          created_at: string | null
          currency_conversion_rate: number | null
          failure_reason: string | null
          fiat_transfer_ref: string | null
          from_address: string | null
          gas_price_gwei: number | null
          gas_used: number | null
          id: string
          item_id: string
          notes: string | null
          payment_method: string
          payout_amount_eth: number | null
          payout_amount_inr: number
          processed_by: string | null
          status: string | null
          to_address: string | null
        }
        Insert: {
          blockchain_tx_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency_conversion_rate?: number | null
          failure_reason?: string | null
          fiat_transfer_ref?: string | null
          from_address?: string | null
          gas_price_gwei?: number | null
          gas_used?: number | null
          id?: string
          item_id: string
          notes?: string | null
          payment_method: string
          payout_amount_eth?: number | null
          payout_amount_inr: number
          processed_by?: string | null
          status?: string | null
          to_address?: string | null
        }
        Update: {
          blockchain_tx_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency_conversion_rate?: number | null
          failure_reason?: string | null
          fiat_transfer_ref?: string | null
          from_address?: string | null
          gas_price_gwei?: number | null
          gas_used?: number | null
          id?: string
          item_id?: string
          notes?: string | null
          payment_method?: string
          payout_amount_eth?: number | null
          payout_amount_inr?: number
          processed_by?: string | null
          status?: string | null
          to_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "official"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "official"],
    },
  },
} as const
