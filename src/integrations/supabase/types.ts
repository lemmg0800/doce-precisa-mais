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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias_produto: {
        Row: {
          ativa: boolean
          cor: string
          created_at: string
          id: string
          is_default: boolean
          nome_categoria: string
          ordem_exibicao: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          is_default?: boolean
          nome_categoria: string
          ordem_exibicao?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          is_default?: boolean
          nome_categoria?: string
          ordem_exibicao?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          habilitar_receitas: boolean
          percentual_custo_fixo: number
          percentual_lucro: number
          tipo_arredondamento_preco: Database["public"]["Enums"]["tipo_arredondamento"]
          updated_at: string
          user_id: string
          valor_hora_trabalho: number
        }
        Insert: {
          habilitar_receitas?: boolean
          percentual_custo_fixo?: number
          percentual_lucro?: number
          tipo_arredondamento_preco?: Database["public"]["Enums"]["tipo_arredondamento"]
          updated_at?: string
          user_id: string
          valor_hora_trabalho?: number
        }
        Update: {
          habilitar_receitas?: boolean
          percentual_custo_fixo?: number
          percentual_lucro?: number
          tipo_arredondamento_preco?: Database["public"]["Enums"]["tipo_arredondamento"]
          updated_at?: string
          user_id?: string
          valor_hora_trabalho?: number
        }
        Relationships: []
      }
      kit_itens: {
        Row: {
          created_at: string
          id: string
          kit_id: string
          materia_prima_id: string
          quantidade_utilizada: number
          unidade_utilizada:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          materia_prima_id: string
          quantidade_utilizada?: number
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          materia_prima_id?: string
          quantidade_utilizada?: number
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits_embalagem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_itens_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materias_primas"
            referencedColumns: ["id"]
          },
        ]
      }
      kits_embalagem: {
        Row: {
          created_at: string
          id: string
          nome_kit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_kit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_kit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materias_primas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_materia"]
          created_at: string
          id: string
          nome: string
          quantidade_embalagem: number
          unidade_medida: Database["public"]["Enums"]["unidade_medida"]
          updated_at: string
          user_id: string
          valor_embalagem: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_materia"]
          created_at?: string
          id?: string
          nome: string
          quantidade_embalagem?: number
          unidade_medida?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          user_id: string
          valor_embalagem?: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_materia"]
          created_at?: string
          id?: string
          nome?: string
          quantidade_embalagem?: number
          unidade_medida?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          user_id?: string
          valor_embalagem?: number
        }
        Relationships: []
      }
      produto_itens: {
        Row: {
          created_at: string
          id: string
          materia_prima_id: string
          produto_id: string
          quantidade_utilizada: number
          unidade_utilizada:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Insert: {
          created_at?: string
          id?: string
          materia_prima_id: string
          produto_id: string
          quantidade_utilizada?: number
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Update: {
          created_at?: string
          id?: string
          materia_prima_id?: string
          produto_id?: string
          quantidade_utilizada?: number
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_itens_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materias_primas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_receitas: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          quantidade_utilizada: number
          receita_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          quantidade_utilizada?: number
          receita_id: string
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          quantidade_utilizada?: number
          receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_receitas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_receitas_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          created_at: string
          id: string
          kit_embalagem_id: string | null
          nome_produto: string
          percentual_perda: number
          preco_praticado: number | null
          rendimento: number
          tempo_producao_minutos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          kit_embalagem_id?: string | null
          nome_produto: string
          percentual_perda?: number
          preco_praticado?: number | null
          rendimento?: number
          tempo_producao_minutos?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          kit_embalagem_id?: string | null
          nome_produto?: string
          percentual_perda?: number
          preco_praticado?: number | null
          rendimento?: number
          tempo_producao_minutos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_kit_embalagem_id_fkey"
            columns: ["kit_embalagem_id"]
            isOneToOne: false
            referencedRelation: "kits_embalagem"
            referencedColumns: ["id"]
          },
        ]
      }
      receita_itens: {
        Row: {
          created_at: string
          id: string
          materia_prima_id: string
          quantidade_utilizada: number
          receita_id: string
          unidade_utilizada:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Insert: {
          created_at?: string
          id?: string
          materia_prima_id: string
          quantidade_utilizada?: number
          receita_id: string
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Update: {
          created_at?: string
          id?: string
          materia_prima_id?: string
          quantidade_utilizada?: number
          receita_id?: string
          unidade_utilizada?:
            | Database["public"]["Enums"]["unidade_medida"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "receita_itens_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materias_primas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receita_itens_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          created_at: string
          id: string
          nome_receita: string
          rendimento: number
          unidade_rendimento: Database["public"]["Enums"]["unidade_medida"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_receita: string
          rendimento?: number
          unidade_rendimento?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_receita?: string
          rendimento?: number
          unidade_rendimento?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_materia: "ingrediente" | "embalagem"
      tipo_arredondamento: "nenhum" | "0.10" | "0.50" | "1.00"
      unidade_medida: "g" | "kg" | "ml" | "L" | "unidade"
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
      categoria_materia: ["ingrediente", "embalagem"],
      tipo_arredondamento: ["nenhum", "0.10", "0.50", "1.00"],
      unidade_medida: ["g", "kg", "ml", "L", "unidade"],
    },
  },
} as const
