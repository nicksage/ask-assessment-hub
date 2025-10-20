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
      ai_settings: {
        Row: {
          created_at: string | null
          id: string
          openai_api_key: string | null
          provider: Database["public"]["Enums"]["ai_provider"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          openai_api_key?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          openai_api_key?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_configurations: {
        Row: {
          base_url: string
          bearer_token: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_url: string
          bearer_token: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_url?: string
          bearer_token?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_endpoints: {
        Row: {
          config_id: string | null
          created_at: string | null
          id: string
          method: string
          name: string
          path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          id?: string
          method: string
          name: string
          path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          id?: string
          method?: string
          name?: string
          path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_endpoints_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "api_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_schema_mappings: {
        Row: {
          column_mappings: Json
          created_at: string | null
          endpoint_id: string | null
          id: string
          last_synced_at: string | null
          table_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          column_mappings: Json
          created_at?: string | null
          endpoint_id?: string | null
          id?: string
          last_synced_at?: string | null
          table_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          column_mappings?: Json
          created_at?: string | null
          endpoint_id?: string | null
          id?: string
          last_synced_at?: string | null
          table_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_schema_mappings_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_periods: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: number | null
          name: string | null
          record_id: string
          record_updated_at: string | null
          sort_order: number | null
          source_endpoint_id: string | null
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number | null
          name?: string | null
          record_id?: string
          record_updated_at?: string | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number | null
          name?: string | null
          record_id?: string
          record_updated_at?: string | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_periods_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          admin_team_ids: Json | null
          assessables: Json | null
          assessment_period_id: string | null
          assessment_template_id: number | null
          canceled_by_user_id: string | null
          canceled_date: string | null
          confirm_text: string | null
          created_at: string | null
          deleted_at: string | null
          due_date: string | null
          email_project_start: Json | null
          enable_not_applicable_response_config: boolean | null
          finalized_by_user_id: string | null
          finalized_date: string | null
          id: number | null
          info: string | null
          instruction_text: string | null
          landing_text: string | null
          name: string | null
          owner_user_ids: Json | null
          project_options: Json | null
          record_id: string
          record_updated_at: string | null
          review_request_id: string | null
          source_endpoint_id: string | null
          started_by_user_id: string | null
          started_date: string | null
          status: string | null
          survey_type: string | null
          synced_at: string | null
          type: string | null
          updated_at: string | null
          user_assessment_ids: Json | null
          user_id: string
          viewonly_team_ids: Json | null
          viewonly_user_ids: Json | null
        }
        Insert: {
          admin_team_ids?: Json | null
          assessables?: Json | null
          assessment_period_id?: string | null
          assessment_template_id?: number | null
          canceled_by_user_id?: string | null
          canceled_date?: string | null
          confirm_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          due_date?: string | null
          email_project_start?: Json | null
          enable_not_applicable_response_config?: boolean | null
          finalized_by_user_id?: string | null
          finalized_date?: string | null
          id?: number | null
          info?: string | null
          instruction_text?: string | null
          landing_text?: string | null
          name?: string | null
          owner_user_ids?: Json | null
          project_options?: Json | null
          record_id?: string
          record_updated_at?: string | null
          review_request_id?: string | null
          source_endpoint_id?: string | null
          started_by_user_id?: string | null
          started_date?: string | null
          status?: string | null
          survey_type?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
          user_assessment_ids?: Json | null
          user_id: string
          viewonly_team_ids?: Json | null
          viewonly_user_ids?: Json | null
        }
        Update: {
          admin_team_ids?: Json | null
          assessables?: Json | null
          assessment_period_id?: string | null
          assessment_template_id?: number | null
          canceled_by_user_id?: string | null
          canceled_date?: string | null
          confirm_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          due_date?: string | null
          email_project_start?: Json | null
          enable_not_applicable_response_config?: boolean | null
          finalized_by_user_id?: string | null
          finalized_date?: string | null
          id?: number | null
          info?: string | null
          instruction_text?: string | null
          landing_text?: string | null
          name?: string | null
          owner_user_ids?: Json | null
          project_options?: Json | null
          record_id?: string
          record_updated_at?: string | null
          review_request_id?: string | null
          source_endpoint_id?: string | null
          started_by_user_id?: string | null
          started_date?: string | null
          status?: string | null
          survey_type?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
          user_assessment_ids?: Json | null
          user_id?: string
          viewonly_team_ids?: Json | null
          viewonly_user_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          assertion_ids: Json | null
          control_category_id: number | null
          control_objective: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          field_data: string | null
          framework_item_ids: Json | null
          id: number | null
          id_code: string | null
          id_string: string | null
          implementation_count: number | null
          library_control_classification_id: string | null
          library_control_nature_id: string | null
          library_control_type_id: string | null
          linkify_uid: string | null
          multiselect_option_ids: Json | null
          name: string | null
          record_id: string
          record_updated_at: string | null
          risk_ids: Json | null
          risk_statement: string | null
          select_option_ids: Json | null
          source_endpoint_id: string | null
          subprocess_id: number | null
          synced_at: string | null
          uid: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assertion_ids?: Json | null
          control_category_id?: number | null
          control_objective?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          field_data?: string | null
          framework_item_ids?: Json | null
          id?: number | null
          id_code?: string | null
          id_string?: string | null
          implementation_count?: number | null
          library_control_classification_id?: string | null
          library_control_nature_id?: string | null
          library_control_type_id?: string | null
          linkify_uid?: string | null
          multiselect_option_ids?: Json | null
          name?: string | null
          record_id?: string
          record_updated_at?: string | null
          risk_ids?: Json | null
          risk_statement?: string | null
          select_option_ids?: Json | null
          source_endpoint_id?: string | null
          subprocess_id?: number | null
          synced_at?: string | null
          uid?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assertion_ids?: Json | null
          control_category_id?: number | null
          control_objective?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          field_data?: string | null
          framework_item_ids?: Json | null
          id?: number | null
          id_code?: string | null
          id_string?: string | null
          implementation_count?: number | null
          library_control_classification_id?: string | null
          library_control_nature_id?: string | null
          library_control_type_id?: string | null
          linkify_uid?: string | null
          multiselect_option_ids?: Json | null
          name?: string | null
          record_id?: string
          record_updated_at?: string | null
          risk_ids?: Json | null
          risk_statement?: string | null
          select_option_ids?: Json | null
          source_endpoint_id?: string | null
          subprocess_id?: number | null
          synced_at?: string | null
          uid?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controls_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tools: {
        Row: {
          created_at: string
          description: string
          display_name: string
          edge_function_code: string | null
          error_message: string | null
          id: string
          last_used_at: string | null
          name: string
          status: Database["public"]["Enums"]["tool_status"]
          tables_used: Json
          tool_schema: Json
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_name: string
          edge_function_code?: string | null
          error_message?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          status?: Database["public"]["Enums"]["tool_status"]
          tables_used?: Json
          tool_schema: Json
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          edge_function_code?: string | null
          error_message?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          status?: Database["public"]["Enums"]["tool_status"]
          tables_used?: Json
          tool_schema?: Json
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          address: string | null
          ae_custom_select1_option_id: string | null
          ae_custom_select10_option_id: string | null
          ae_custom_select11_option_id: string | null
          ae_custom_select12_option_id: string | null
          ae_custom_select13_option_id: string | null
          ae_custom_select14_option_id: string | null
          ae_custom_select15_option_id: string | null
          ae_custom_select2_option_id: string | null
          ae_custom_select3_option_id: string | null
          ae_custom_select4_option_id: string | null
          ae_custom_select5_option_id: string | null
          ae_custom_select6_option_id: string | null
          ae_custom_select7_option_id: string | null
          ae_custom_select8_option_id: string | null
          ae_custom_select9_option_id: string | null
          ae_status_option_id: string | null
          audit_business_segment_id: string | null
          audit_division_id: string | null
          audit_office_location_id: number | null
          audit_rotation_schedule_id: number | null
          auditable_entity_parent_id: string | null
          auditable_entity_region_id: number | null
          auditable_entity_type_id: number | null
          availability_impact: string | null
          business_owner_user_id: string | null
          calculated_audit_frequency_id: number | null
          cia_inherent_risk_calc: Json | null
          cia_residual_risk_calc: Json | null
          city: string | null
          confidentiality_impact: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone_number: string | null
          contact_user_id: string | null
          contract_details: string | null
          coordinator_user_id: string | null
          country: string | null
          created_at: string | null
          created_by_user_id: string | null
          current_version: string | null
          custom_currency1: string | null
          custom_currency2: string | null
          custom_currency3: string | null
          custom_currency4: string | null
          custom_date1: string | null
          custom_date10: string | null
          custom_date2: string | null
          custom_date3: string | null
          custom_date4: string | null
          custom_date5: string | null
          custom_date6: string | null
          custom_date7: string | null
          custom_date8: string | null
          custom_date9: string | null
          custom_decimal1: string | null
          custom_decimal2: string | null
          custom_decimal3: string | null
          custom_decimal4: string | null
          custom_decimal5: string | null
          custom_decimal6: string | null
          custom_decimal7: string | null
          custom_decimal8: string | null
          custom_entity_reference: string | null
          custom_text1: string | null
          custom_text10: string | null
          custom_text11: string | null
          custom_text12: string | null
          custom_text13: string | null
          custom_text14: string | null
          custom_text15: string | null
          custom_text2: string | null
          custom_text3: string | null
          custom_text4: string | null
          custom_text5: string | null
          custom_text6: string | null
          custom_text7: string | null
          custom_text8: string | null
          custom_text9: string | null
          custom_user_select1_user_id: string | null
          custom_user_select10_user_id: string | null
          custom_user_select2_user_id: string | null
          custom_user_select3_user_id: string | null
          custom_user_select4_user_id: string | null
          custom_user_select5_user_id: string | null
          custom_user_select6_user_id: string | null
          custom_user_select7_user_id: string | null
          custom_user_select8_user_id: string | null
          custom_user_select9_user_id: string | null
          data_classification_id: string | null
          default_ops_audit_template_id: string | null
          deleted_at: string | null
          description: string | null
          effective_date: string | null
          employees_size: string | null
          estimated_spend: string | null
          executive_user_id: string | null
          external_resource_id: string | null
          field_data: Json | null
          financial_application_id: string | null
          formula_data: Json | null
          id: number | null
          id_string: string | null
          import_source: string | null
          inherent_risk: Json | null
          inherent_risk_calc: string | null
          intake_status: string | null
          integrity_impact: string | null
          is_flagged: boolean | null
          it_asset_status_id: string | null
          it_asset_type_id: string | null
          it_recovery_point_objective: string | null
          it_recovery_time_objective: string | null
          it_security_incident_hours: string | null
          it_service_level_agreement: string | null
          legal_entity_type_id: string | null
          manager_user_id: string | null
          name: string | null
          notes: string | null
          overall_control_effectiveness: Json | null
          parent_id: string | null
          prior_audit_final_report_date: string | null
          prior_audit_id: number | null
          prior_audit_opinion: string | null
          prior_audit_title: string | null
          product_status_id: string | null
          project_plans: Json | null
          record_id: string
          record_updated_at: string | null
          regulatory_audit_frequency_id: string | null
          regulatory_audit_frequency_notes: string | null
          regulatory_next_audit_due: string | null
          regulatory_next_audit_due_date: string | null
          residual_risk: Json | null
          residual_risk_calc: Json | null
          reviewer_user_id: string | null
          risk_next_audit_due: string | null
          risk_next_audit_due_date: string | null
          risk_score_id: string | null
          scope_rationale: string | null
          source_endpoint_id: string | null
          sox_scope_id: string | null
          state: string | null
          synced_at: string | null
          system_component_type_id: string | null
          technical_product_owner_user_id: string | null
          third_party_residual_risk_calc: Json | null
          uid: string | null
          upcoming_audit_end_date: string | null
          upcoming_audit_id: number | null
          upcoming_audit_start_date: string | null
          upcoming_audit_title: string | null
          updated_at: string | null
          user_id: string
          vendor_criticality_id: string | null
          vendor_status: string | null
          vice_president_user_id: string | null
        }
        Insert: {
          address?: string | null
          ae_custom_select1_option_id?: string | null
          ae_custom_select10_option_id?: string | null
          ae_custom_select11_option_id?: string | null
          ae_custom_select12_option_id?: string | null
          ae_custom_select13_option_id?: string | null
          ae_custom_select14_option_id?: string | null
          ae_custom_select15_option_id?: string | null
          ae_custom_select2_option_id?: string | null
          ae_custom_select3_option_id?: string | null
          ae_custom_select4_option_id?: string | null
          ae_custom_select5_option_id?: string | null
          ae_custom_select6_option_id?: string | null
          ae_custom_select7_option_id?: string | null
          ae_custom_select8_option_id?: string | null
          ae_custom_select9_option_id?: string | null
          ae_status_option_id?: string | null
          audit_business_segment_id?: string | null
          audit_division_id?: string | null
          audit_office_location_id?: number | null
          audit_rotation_schedule_id?: number | null
          auditable_entity_parent_id?: string | null
          auditable_entity_region_id?: number | null
          auditable_entity_type_id?: number | null
          availability_impact?: string | null
          business_owner_user_id?: string | null
          calculated_audit_frequency_id?: number | null
          cia_inherent_risk_calc?: Json | null
          cia_residual_risk_calc?: Json | null
          city?: string | null
          confidentiality_impact?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_number?: string | null
          contact_user_id?: string | null
          contract_details?: string | null
          coordinator_user_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          current_version?: string | null
          custom_currency1?: string | null
          custom_currency2?: string | null
          custom_currency3?: string | null
          custom_currency4?: string | null
          custom_date1?: string | null
          custom_date10?: string | null
          custom_date2?: string | null
          custom_date3?: string | null
          custom_date4?: string | null
          custom_date5?: string | null
          custom_date6?: string | null
          custom_date7?: string | null
          custom_date8?: string | null
          custom_date9?: string | null
          custom_decimal1?: string | null
          custom_decimal2?: string | null
          custom_decimal3?: string | null
          custom_decimal4?: string | null
          custom_decimal5?: string | null
          custom_decimal6?: string | null
          custom_decimal7?: string | null
          custom_decimal8?: string | null
          custom_entity_reference?: string | null
          custom_text1?: string | null
          custom_text10?: string | null
          custom_text11?: string | null
          custom_text12?: string | null
          custom_text13?: string | null
          custom_text14?: string | null
          custom_text15?: string | null
          custom_text2?: string | null
          custom_text3?: string | null
          custom_text4?: string | null
          custom_text5?: string | null
          custom_text6?: string | null
          custom_text7?: string | null
          custom_text8?: string | null
          custom_text9?: string | null
          custom_user_select1_user_id?: string | null
          custom_user_select10_user_id?: string | null
          custom_user_select2_user_id?: string | null
          custom_user_select3_user_id?: string | null
          custom_user_select4_user_id?: string | null
          custom_user_select5_user_id?: string | null
          custom_user_select6_user_id?: string | null
          custom_user_select7_user_id?: string | null
          custom_user_select8_user_id?: string | null
          custom_user_select9_user_id?: string | null
          data_classification_id?: string | null
          default_ops_audit_template_id?: string | null
          deleted_at?: string | null
          description?: string | null
          effective_date?: string | null
          employees_size?: string | null
          estimated_spend?: string | null
          executive_user_id?: string | null
          external_resource_id?: string | null
          field_data?: Json | null
          financial_application_id?: string | null
          formula_data?: Json | null
          id?: number | null
          id_string?: string | null
          import_source?: string | null
          inherent_risk?: Json | null
          inherent_risk_calc?: string | null
          intake_status?: string | null
          integrity_impact?: string | null
          is_flagged?: boolean | null
          it_asset_status_id?: string | null
          it_asset_type_id?: string | null
          it_recovery_point_objective?: string | null
          it_recovery_time_objective?: string | null
          it_security_incident_hours?: string | null
          it_service_level_agreement?: string | null
          legal_entity_type_id?: string | null
          manager_user_id?: string | null
          name?: string | null
          notes?: string | null
          overall_control_effectiveness?: Json | null
          parent_id?: string | null
          prior_audit_final_report_date?: string | null
          prior_audit_id?: number | null
          prior_audit_opinion?: string | null
          prior_audit_title?: string | null
          product_status_id?: string | null
          project_plans?: Json | null
          record_id?: string
          record_updated_at?: string | null
          regulatory_audit_frequency_id?: string | null
          regulatory_audit_frequency_notes?: string | null
          regulatory_next_audit_due?: string | null
          regulatory_next_audit_due_date?: string | null
          residual_risk?: Json | null
          residual_risk_calc?: Json | null
          reviewer_user_id?: string | null
          risk_next_audit_due?: string | null
          risk_next_audit_due_date?: string | null
          risk_score_id?: string | null
          scope_rationale?: string | null
          source_endpoint_id?: string | null
          sox_scope_id?: string | null
          state?: string | null
          synced_at?: string | null
          system_component_type_id?: string | null
          technical_product_owner_user_id?: string | null
          third_party_residual_risk_calc?: Json | null
          uid?: string | null
          upcoming_audit_end_date?: string | null
          upcoming_audit_id?: number | null
          upcoming_audit_start_date?: string | null
          upcoming_audit_title?: string | null
          updated_at?: string | null
          user_id: string
          vendor_criticality_id?: string | null
          vendor_status?: string | null
          vice_president_user_id?: string | null
        }
        Update: {
          address?: string | null
          ae_custom_select1_option_id?: string | null
          ae_custom_select10_option_id?: string | null
          ae_custom_select11_option_id?: string | null
          ae_custom_select12_option_id?: string | null
          ae_custom_select13_option_id?: string | null
          ae_custom_select14_option_id?: string | null
          ae_custom_select15_option_id?: string | null
          ae_custom_select2_option_id?: string | null
          ae_custom_select3_option_id?: string | null
          ae_custom_select4_option_id?: string | null
          ae_custom_select5_option_id?: string | null
          ae_custom_select6_option_id?: string | null
          ae_custom_select7_option_id?: string | null
          ae_custom_select8_option_id?: string | null
          ae_custom_select9_option_id?: string | null
          ae_status_option_id?: string | null
          audit_business_segment_id?: string | null
          audit_division_id?: string | null
          audit_office_location_id?: number | null
          audit_rotation_schedule_id?: number | null
          auditable_entity_parent_id?: string | null
          auditable_entity_region_id?: number | null
          auditable_entity_type_id?: number | null
          availability_impact?: string | null
          business_owner_user_id?: string | null
          calculated_audit_frequency_id?: number | null
          cia_inherent_risk_calc?: Json | null
          cia_residual_risk_calc?: Json | null
          city?: string | null
          confidentiality_impact?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_number?: string | null
          contact_user_id?: string | null
          contract_details?: string | null
          coordinator_user_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          current_version?: string | null
          custom_currency1?: string | null
          custom_currency2?: string | null
          custom_currency3?: string | null
          custom_currency4?: string | null
          custom_date1?: string | null
          custom_date10?: string | null
          custom_date2?: string | null
          custom_date3?: string | null
          custom_date4?: string | null
          custom_date5?: string | null
          custom_date6?: string | null
          custom_date7?: string | null
          custom_date8?: string | null
          custom_date9?: string | null
          custom_decimal1?: string | null
          custom_decimal2?: string | null
          custom_decimal3?: string | null
          custom_decimal4?: string | null
          custom_decimal5?: string | null
          custom_decimal6?: string | null
          custom_decimal7?: string | null
          custom_decimal8?: string | null
          custom_entity_reference?: string | null
          custom_text1?: string | null
          custom_text10?: string | null
          custom_text11?: string | null
          custom_text12?: string | null
          custom_text13?: string | null
          custom_text14?: string | null
          custom_text15?: string | null
          custom_text2?: string | null
          custom_text3?: string | null
          custom_text4?: string | null
          custom_text5?: string | null
          custom_text6?: string | null
          custom_text7?: string | null
          custom_text8?: string | null
          custom_text9?: string | null
          custom_user_select1_user_id?: string | null
          custom_user_select10_user_id?: string | null
          custom_user_select2_user_id?: string | null
          custom_user_select3_user_id?: string | null
          custom_user_select4_user_id?: string | null
          custom_user_select5_user_id?: string | null
          custom_user_select6_user_id?: string | null
          custom_user_select7_user_id?: string | null
          custom_user_select8_user_id?: string | null
          custom_user_select9_user_id?: string | null
          data_classification_id?: string | null
          default_ops_audit_template_id?: string | null
          deleted_at?: string | null
          description?: string | null
          effective_date?: string | null
          employees_size?: string | null
          estimated_spend?: string | null
          executive_user_id?: string | null
          external_resource_id?: string | null
          field_data?: Json | null
          financial_application_id?: string | null
          formula_data?: Json | null
          id?: number | null
          id_string?: string | null
          import_source?: string | null
          inherent_risk?: Json | null
          inherent_risk_calc?: string | null
          intake_status?: string | null
          integrity_impact?: string | null
          is_flagged?: boolean | null
          it_asset_status_id?: string | null
          it_asset_type_id?: string | null
          it_recovery_point_objective?: string | null
          it_recovery_time_objective?: string | null
          it_security_incident_hours?: string | null
          it_service_level_agreement?: string | null
          legal_entity_type_id?: string | null
          manager_user_id?: string | null
          name?: string | null
          notes?: string | null
          overall_control_effectiveness?: Json | null
          parent_id?: string | null
          prior_audit_final_report_date?: string | null
          prior_audit_id?: number | null
          prior_audit_opinion?: string | null
          prior_audit_title?: string | null
          product_status_id?: string | null
          project_plans?: Json | null
          record_id?: string
          record_updated_at?: string | null
          regulatory_audit_frequency_id?: string | null
          regulatory_audit_frequency_notes?: string | null
          regulatory_next_audit_due?: string | null
          regulatory_next_audit_due_date?: string | null
          residual_risk?: Json | null
          residual_risk_calc?: Json | null
          reviewer_user_id?: string | null
          risk_next_audit_due?: string | null
          risk_next_audit_due_date?: string | null
          risk_score_id?: string | null
          scope_rationale?: string | null
          source_endpoint_id?: string | null
          sox_scope_id?: string | null
          state?: string | null
          synced_at?: string | null
          system_component_type_id?: string | null
          technical_product_owner_user_id?: string | null
          third_party_residual_risk_calc?: Json | null
          uid?: string | null
          upcoming_audit_end_date?: string | null
          upcoming_audit_id?: number | null
          upcoming_audit_start_date?: string | null
          upcoming_audit_title?: string | null
          updated_at?: string | null
          user_id?: string
          vendor_criticality_id?: string | null
          vendor_status?: string | null
          vice_president_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_risks: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          entity_id: number | null
          id: number | null
          record_id: string
          record_updated_at: string | null
          risk_id: number | null
          source_endpoint_id: string | null
          status: string | null
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          entity_id?: number | null
          id?: number | null
          record_id?: string
          record_updated_at?: string | null
          risk_id?: number | null
          source_endpoint_id?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          entity_id?: number | null
          id?: number | null
          record_id?: string
          record_updated_at?: string | null
          risk_id?: number | null
          source_endpoint_id?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_risks_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_types: {
        Row: {
          admin_team_ids: Json | null
          allowed_sections: Json | null
          allowed_team_ids: Json | null
          created_at: string | null
          createonly_team_ids: Json | null
          deleted_at: string | null
          enabled_attributes: Json | null
          excluded_attributes: Json | null
          form_template_id: number | null
          id: number | null
          intake_form_template_id: string | null
          inventory_class: string | null
          key: string | null
          level: string | null
          manager_team_ids: Json | null
          name: string | null
          owner_user_ids: Json | null
          record_id: string
          record_updated_at: string | null
          show_class_form_template: boolean | null
          sort_order: number | null
          source_endpoint_id: string | null
          synced_at: string | null
          updated_at: string | null
          user_id: string
          viewonly_team_ids: Json | null
        }
        Insert: {
          admin_team_ids?: Json | null
          allowed_sections?: Json | null
          allowed_team_ids?: Json | null
          created_at?: string | null
          createonly_team_ids?: Json | null
          deleted_at?: string | null
          enabled_attributes?: Json | null
          excluded_attributes?: Json | null
          form_template_id?: number | null
          id?: number | null
          intake_form_template_id?: string | null
          inventory_class?: string | null
          key?: string | null
          level?: string | null
          manager_team_ids?: Json | null
          name?: string | null
          owner_user_ids?: Json | null
          record_id?: string
          record_updated_at?: string | null
          show_class_form_template?: boolean | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
          viewonly_team_ids?: Json | null
        }
        Update: {
          admin_team_ids?: Json | null
          allowed_sections?: Json | null
          allowed_team_ids?: Json | null
          created_at?: string | null
          createonly_team_ids?: Json | null
          deleted_at?: string | null
          enabled_attributes?: Json | null
          excluded_attributes?: Json | null
          form_template_id?: number | null
          id?: number | null
          intake_form_template_id?: string | null
          inventory_class?: string | null
          key?: string | null
          level?: string | null
          manager_team_ids?: Json | null
          name?: string | null
          owner_user_ids?: Json | null
          record_id?: string
          record_updated_at?: string | null
          show_class_form_template?: boolean | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
          viewonly_team_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_types_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_categories: {
        Row: {
          admin_team_ids: Json | null
          created_at: string | null
          deleted_at: string | null
          form_template_id: number | null
          id: number | null
          is_default: boolean | null
          key: string | null
          manager_team_ids: Json | null
          name: string | null
          owner_user_ids: Json | null
          record_id: string
          record_updated_at: string | null
          sort_order: number | null
          source_endpoint_id: string | null
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_team_ids?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          form_template_id?: number | null
          id?: number | null
          is_default?: boolean | null
          key?: string | null
          manager_team_ids?: Json | null
          name?: string | null
          owner_user_ids?: Json | null
          record_id?: string
          record_updated_at?: string | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_team_ids?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          form_template_id?: number | null
          id?: number | null
          is_default?: boolean | null
          key?: string | null
          manager_team_ids?: Json | null
          name?: string | null
          owner_user_ids?: Json | null
          record_id?: string
          record_updated_at?: string | null
          sort_order?: number | null
          source_endpoint_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_categories_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          activity: string | null
          created_at: string | null
          created_by_user_id: number | null
          custom_date1: string | null
          custom_date10: string | null
          custom_date11: string | null
          custom_date12: string | null
          custom_date13: string | null
          custom_date14: string | null
          custom_date2: string | null
          custom_date3: string | null
          custom_date4: string | null
          custom_date5: string | null
          custom_date6: string | null
          custom_date7: string | null
          custom_date8: string | null
          custom_date9: string | null
          custom_json1: string | null
          custom_text1: string | null
          custom_text10: string | null
          custom_text11: string | null
          custom_text12: string | null
          custom_text13: string | null
          custom_text14: string | null
          custom_text15: string | null
          custom_text16: string | null
          custom_text17: string | null
          custom_text18: string | null
          custom_text19: string | null
          custom_text2: string | null
          custom_text20: string | null
          custom_text21: string | null
          custom_text22: string | null
          custom_text23: string | null
          custom_text24: string | null
          custom_text25: string | null
          custom_text3: string | null
          custom_text4: string | null
          custom_text5: string | null
          custom_text6: string | null
          custom_text7: string | null
          custom_text8: string | null
          custom_text9: string | null
          custom_user_select1_user_id: string | null
          custom_user_select10_user_id: string | null
          custom_user_select2_user_id: string | null
          custom_user_select3_user_id: string | null
          custom_user_select4_user_id: string | null
          custom_user_select5_user_id: string | null
          custom_user_select6_user_id: string | null
          custom_user_select7_user_id: string | null
          custom_user_select8_user_id: string | null
          custom_user_select9_user_id: string | null
          deleted_at: string | null
          description: string | null
          field_data: Json | null
          formula_data: Json | null
          id: number | null
          id_code: string | null
          id_string: string | null
          inherent_risk: string | null
          is_flagged: boolean | null
          mitigation_factors: string | null
          name: string | null
          notes: string | null
          primary_owner_user_id: string | null
          prior_audit_final_report_date: string | null
          prior_audit_id: string | null
          process_id: number | null
          project_plans: Json | null
          record_id: string
          record_updated_at: string | null
          reference_meta: Json | null
          residual_risk: string | null
          residual_risk_calc: Json | null
          reviewer_user_id: string | null
          risk_appetite_id: string | null
          risk_appetite_score: string | null
          risk_bidirectional_reference_ids: Json | null
          risk_category_id: number | null
          risk_custom_select1_option_id: string | null
          risk_custom_select10_option_id: string | null
          risk_custom_select11_option_id: string | null
          risk_custom_select12_option_id: string | null
          risk_custom_select13_option_id: string | null
          risk_custom_select14_option_id: string | null
          risk_custom_select15_option_id: string | null
          risk_custom_select16_option_id: string | null
          risk_custom_select17_option_id: string | null
          risk_custom_select18_option_id: string | null
          risk_custom_select19_option_id: string | null
          risk_custom_select2_option_id: string | null
          risk_custom_select20_option_id: string | null
          risk_custom_select21_option_id: string | null
          risk_custom_select22_option_id: string | null
          risk_custom_select23_option_id: string | null
          risk_custom_select24_option_id: string | null
          risk_custom_select25_option_id: string | null
          risk_custom_select26_option_id: string | null
          risk_custom_select27_option_id: string | null
          risk_custom_select3_option_id: string | null
          risk_custom_select4_option_id: string | null
          risk_custom_select5_option_id: string | null
          risk_custom_select6_option_id: string | null
          risk_custom_select7_option_id: string | null
          risk_custom_select8_option_id: string | null
          risk_custom_select9_option_id: string | null
          risk_response_id: string | null
          risk_type_id: number | null
          source_endpoint_id: string | null
          status: string | null
          subprocess_id: string | null
          synced_at: string | null
          uid: string | null
          upcoming_audit_id: number | null
          updated_at: string | null
          user_id: string
          xuid: string | null
        }
        Insert: {
          activity?: string | null
          created_at?: string | null
          created_by_user_id?: number | null
          custom_date1?: string | null
          custom_date10?: string | null
          custom_date11?: string | null
          custom_date12?: string | null
          custom_date13?: string | null
          custom_date14?: string | null
          custom_date2?: string | null
          custom_date3?: string | null
          custom_date4?: string | null
          custom_date5?: string | null
          custom_date6?: string | null
          custom_date7?: string | null
          custom_date8?: string | null
          custom_date9?: string | null
          custom_json1?: string | null
          custom_text1?: string | null
          custom_text10?: string | null
          custom_text11?: string | null
          custom_text12?: string | null
          custom_text13?: string | null
          custom_text14?: string | null
          custom_text15?: string | null
          custom_text16?: string | null
          custom_text17?: string | null
          custom_text18?: string | null
          custom_text19?: string | null
          custom_text2?: string | null
          custom_text20?: string | null
          custom_text21?: string | null
          custom_text22?: string | null
          custom_text23?: string | null
          custom_text24?: string | null
          custom_text25?: string | null
          custom_text3?: string | null
          custom_text4?: string | null
          custom_text5?: string | null
          custom_text6?: string | null
          custom_text7?: string | null
          custom_text8?: string | null
          custom_text9?: string | null
          custom_user_select1_user_id?: string | null
          custom_user_select10_user_id?: string | null
          custom_user_select2_user_id?: string | null
          custom_user_select3_user_id?: string | null
          custom_user_select4_user_id?: string | null
          custom_user_select5_user_id?: string | null
          custom_user_select6_user_id?: string | null
          custom_user_select7_user_id?: string | null
          custom_user_select8_user_id?: string | null
          custom_user_select9_user_id?: string | null
          deleted_at?: string | null
          description?: string | null
          field_data?: Json | null
          formula_data?: Json | null
          id?: number | null
          id_code?: string | null
          id_string?: string | null
          inherent_risk?: string | null
          is_flagged?: boolean | null
          mitigation_factors?: string | null
          name?: string | null
          notes?: string | null
          primary_owner_user_id?: string | null
          prior_audit_final_report_date?: string | null
          prior_audit_id?: string | null
          process_id?: number | null
          project_plans?: Json | null
          record_id?: string
          record_updated_at?: string | null
          reference_meta?: Json | null
          residual_risk?: string | null
          residual_risk_calc?: Json | null
          reviewer_user_id?: string | null
          risk_appetite_id?: string | null
          risk_appetite_score?: string | null
          risk_bidirectional_reference_ids?: Json | null
          risk_category_id?: number | null
          risk_custom_select1_option_id?: string | null
          risk_custom_select10_option_id?: string | null
          risk_custom_select11_option_id?: string | null
          risk_custom_select12_option_id?: string | null
          risk_custom_select13_option_id?: string | null
          risk_custom_select14_option_id?: string | null
          risk_custom_select15_option_id?: string | null
          risk_custom_select16_option_id?: string | null
          risk_custom_select17_option_id?: string | null
          risk_custom_select18_option_id?: string | null
          risk_custom_select19_option_id?: string | null
          risk_custom_select2_option_id?: string | null
          risk_custom_select20_option_id?: string | null
          risk_custom_select21_option_id?: string | null
          risk_custom_select22_option_id?: string | null
          risk_custom_select23_option_id?: string | null
          risk_custom_select24_option_id?: string | null
          risk_custom_select25_option_id?: string | null
          risk_custom_select26_option_id?: string | null
          risk_custom_select27_option_id?: string | null
          risk_custom_select3_option_id?: string | null
          risk_custom_select4_option_id?: string | null
          risk_custom_select5_option_id?: string | null
          risk_custom_select6_option_id?: string | null
          risk_custom_select7_option_id?: string | null
          risk_custom_select8_option_id?: string | null
          risk_custom_select9_option_id?: string | null
          risk_response_id?: string | null
          risk_type_id?: number | null
          source_endpoint_id?: string | null
          status?: string | null
          subprocess_id?: string | null
          synced_at?: string | null
          uid?: string | null
          upcoming_audit_id?: number | null
          updated_at?: string | null
          user_id: string
          xuid?: string | null
        }
        Update: {
          activity?: string | null
          created_at?: string | null
          created_by_user_id?: number | null
          custom_date1?: string | null
          custom_date10?: string | null
          custom_date11?: string | null
          custom_date12?: string | null
          custom_date13?: string | null
          custom_date14?: string | null
          custom_date2?: string | null
          custom_date3?: string | null
          custom_date4?: string | null
          custom_date5?: string | null
          custom_date6?: string | null
          custom_date7?: string | null
          custom_date8?: string | null
          custom_date9?: string | null
          custom_json1?: string | null
          custom_text1?: string | null
          custom_text10?: string | null
          custom_text11?: string | null
          custom_text12?: string | null
          custom_text13?: string | null
          custom_text14?: string | null
          custom_text15?: string | null
          custom_text16?: string | null
          custom_text17?: string | null
          custom_text18?: string | null
          custom_text19?: string | null
          custom_text2?: string | null
          custom_text20?: string | null
          custom_text21?: string | null
          custom_text22?: string | null
          custom_text23?: string | null
          custom_text24?: string | null
          custom_text25?: string | null
          custom_text3?: string | null
          custom_text4?: string | null
          custom_text5?: string | null
          custom_text6?: string | null
          custom_text7?: string | null
          custom_text8?: string | null
          custom_text9?: string | null
          custom_user_select1_user_id?: string | null
          custom_user_select10_user_id?: string | null
          custom_user_select2_user_id?: string | null
          custom_user_select3_user_id?: string | null
          custom_user_select4_user_id?: string | null
          custom_user_select5_user_id?: string | null
          custom_user_select6_user_id?: string | null
          custom_user_select7_user_id?: string | null
          custom_user_select8_user_id?: string | null
          custom_user_select9_user_id?: string | null
          deleted_at?: string | null
          description?: string | null
          field_data?: Json | null
          formula_data?: Json | null
          id?: number | null
          id_code?: string | null
          id_string?: string | null
          inherent_risk?: string | null
          is_flagged?: boolean | null
          mitigation_factors?: string | null
          name?: string | null
          notes?: string | null
          primary_owner_user_id?: string | null
          prior_audit_final_report_date?: string | null
          prior_audit_id?: string | null
          process_id?: number | null
          project_plans?: Json | null
          record_id?: string
          record_updated_at?: string | null
          reference_meta?: Json | null
          residual_risk?: string | null
          residual_risk_calc?: Json | null
          reviewer_user_id?: string | null
          risk_appetite_id?: string | null
          risk_appetite_score?: string | null
          risk_bidirectional_reference_ids?: Json | null
          risk_category_id?: number | null
          risk_custom_select1_option_id?: string | null
          risk_custom_select10_option_id?: string | null
          risk_custom_select11_option_id?: string | null
          risk_custom_select12_option_id?: string | null
          risk_custom_select13_option_id?: string | null
          risk_custom_select14_option_id?: string | null
          risk_custom_select15_option_id?: string | null
          risk_custom_select16_option_id?: string | null
          risk_custom_select17_option_id?: string | null
          risk_custom_select18_option_id?: string | null
          risk_custom_select19_option_id?: string | null
          risk_custom_select2_option_id?: string | null
          risk_custom_select20_option_id?: string | null
          risk_custom_select21_option_id?: string | null
          risk_custom_select22_option_id?: string | null
          risk_custom_select23_option_id?: string | null
          risk_custom_select24_option_id?: string | null
          risk_custom_select25_option_id?: string | null
          risk_custom_select26_option_id?: string | null
          risk_custom_select27_option_id?: string | null
          risk_custom_select3_option_id?: string | null
          risk_custom_select4_option_id?: string | null
          risk_custom_select5_option_id?: string | null
          risk_custom_select6_option_id?: string | null
          risk_custom_select7_option_id?: string | null
          risk_custom_select8_option_id?: string | null
          risk_custom_select9_option_id?: string | null
          risk_response_id?: string | null
          risk_type_id?: number | null
          source_endpoint_id?: string | null
          status?: string | null
          subprocess_id?: string | null
          synced_at?: string | null
          uid?: string | null
          upcoming_audit_id?: number | null
          updated_at?: string | null
          user_id?: string
          xuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_risks_risk_category"
            columns: ["risk_category_id"]
            isOneToOne: false
            referencedRelation: "risk_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_source_endpoint_id_fkey"
            columns: ["source_endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_table_from_schema: {
        Args: { p_columns: Json; p_table_name: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      ai_provider: "lovable" | "openai"
      tool_status: "draft" | "generating" | "active" | "error"
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
      ai_provider: ["lovable", "openai"],
      tool_status: ["draft", "generating", "active", "error"],
    },
  },
} as const
