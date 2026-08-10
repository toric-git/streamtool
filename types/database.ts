export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RoomRole = "owner" | "admin" | "member" | "guest";
export type RoomVisibility = "private" | "public";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type PlaybackAction = "play" | "stop" | "stop_all";
export type PlaybackMode = "one_shot" | "toggle_loop";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          room_code: string;
          password_hash: string | null;
          visibility: RoomVisibility;
          guest_enabled: boolean;
          guest_can_play: boolean;
          upload_enabled: boolean;
          upload_requires_approval: boolean;
          max_members: number;
          master_volume: number;
          obs_volume: number;
          default_cooldown_ms: number;
          max_events_per_minute: number;
          max_simultaneous_sounds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          room_code: string;
          password_hash?: string | null;
          visibility?: RoomVisibility;
          guest_enabled?: boolean;
          guest_can_play?: boolean;
          upload_enabled?: boolean;
          upload_requires_approval?: boolean;
          max_members?: number;
          master_volume?: number;
          obs_volume?: number;
          default_cooldown_ms?: number;
          max_events_per_minute?: number;
          max_simultaneous_sounds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          room_code?: string;
          password_hash?: string | null;
          visibility?: RoomVisibility;
          guest_enabled?: boolean;
          guest_can_play?: boolean;
          upload_enabled?: boolean;
          upload_requires_approval?: boolean;
          max_members?: number;
          master_volume?: number;
          obs_volume?: number;
          default_cooldown_ms?: number;
          max_events_per_minute?: number;
          max_simultaneous_sounds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          display_name: string;
          role: RoomRole;
          can_play: boolean;
          can_upload: boolean;
          is_muted: boolean;
          joined_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          display_name: string;
          role: RoomRole;
          can_play?: boolean;
          can_upload?: boolean;
          is_muted?: boolean;
          joined_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          display_name?: string;
          role?: RoomRole;
          can_play?: boolean;
          can_upload?: boolean;
          is_muted?: boolean;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sound_favorites: {
        Row: {
          user_id: string;
          room_id: string;
          sound_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          room_id: string;
          sound_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          room_id?: string;
          sound_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sound_favorites_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sound_favorites_sound_id_fkey";
            columns: ["sound_id"];
            isOneToOne: false;
            referencedRelation: "sounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sound_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sound_categories: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sound_categories_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      sounds: {
        Row: {
          id: string;
          room_id: string;
          uploader_id: string;
          category_id: string | null;
          name: string;
          audio_path: string;
          image_path: string | null;
          button_color: string;
          text_color: string;
          volume: number;
          playback_mode: PlaybackMode;
          cooldown_ms: number;
          duration_ms: number;
          sort_order: number;
          approval_status: ApprovalStatus;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          uploader_id: string;
          category_id?: string | null;
          name: string;
          audio_path: string;
          image_path?: string | null;
          button_color?: string;
          text_color?: string;
          volume?: number;
          playback_mode?: PlaybackMode;
          cooldown_ms?: number;
          duration_ms: number;
          sort_order?: number;
          approval_status?: ApprovalStatus;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          uploader_id?: string;
          category_id?: string | null;
          name?: string;
          audio_path?: string;
          image_path?: string | null;
          button_color?: string;
          text_color?: string;
          volume?: number;
          playback_mode?: PlaybackMode;
          cooldown_ms?: number;
          duration_ms?: number;
          sort_order?: number;
          approval_status?: ApprovalStatus;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sounds_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sounds_uploader_id_fkey";
            columns: ["uploader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sounds_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "sound_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      playback_events: {
        Row: {
          id: string;
          room_id: string;
          sound_id: string | null;
          user_id: string;
          action: PlaybackAction;
          volume: number;
          client_event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sound_id?: string | null;
          user_id: string;
          action: PlaybackAction;
          volume?: number;
          client_event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          sound_id?: string | null;
          user_id?: string;
          action?: PlaybackAction;
          volume?: number;
          client_event_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playback_events_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playback_events_sound_id_fkey";
            columns: ["sound_id"];
            isOneToOne: false;
            referencedRelation: "sounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playback_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      obs_tokens: {
        Row: {
          id: string;
          room_id: string;
          token_hash: string;
          token_hint: string | null;
          enabled: boolean;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          token_hash: string;
          token_hint?: string | null;
          enabled?: boolean;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          token_hash?: string;
          token_hint?: string | null;
          enabled?: boolean;
          created_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "obs_tokens_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_room_join_info: {
        Args: { p_room_code: string };
        Returns: {
          room_id: string;
          name: string;
          has_password: boolean;
          guest_enabled: boolean;
          member_count: number;
          max_members: number;
        }[];
      };
      join_room: {
        Args: {
          p_room_code: string;
          p_password?: string | null;
          p_display_name?: string | null;
        };
        Returns: {
          room_id: string;
          role: RoomRole;
        };
      };
      server_join_room: {
        Args: {
          p_user_id: string;
          p_room_code: string;
          p_display_name?: string | null;
        };
        Returns: {
          room_id: string;
          role: RoomRole;
        };
      };
      create_playback_event: {
        Args: {
          p_room_id: string;
          p_sound_id: string | null;
          p_action: PlaybackAction;
          p_volume: number;
          p_client_event_id: string;
        };
        Returns: {
          id: string;
          room_id: string;
          sound_id: string | null;
          user_id: string;
          action: PlaybackAction;
          volume: number;
          client_event_id: string;
          created_at: string;
          user_display_name: string;
        };
      };
      reorder_sounds: {
        Args: {
          p_room_id: string;
          p_sound_ids: string[];
        };
        Returns: undefined;
      };
      approve_sound: {
        Args: { p_sound_id: string };
        Returns: undefined;
      };
      reject_sound: {
        Args: { p_sound_id: string };
        Returns: undefined;
      };
      kick_room_member: {
        Args: { p_room_id: string; p_user_id: string };
        Returns: undefined;
      };
      set_member_play_permission: {
        Args: {
          p_room_id: string;
          p_user_id: string;
          p_can_play: boolean;
          p_is_muted: boolean;
        };
        Returns: undefined;
      };
      set_member_upload_permission: {
        Args: {
          p_room_id: string;
          p_user_id: string;
          p_can_upload: boolean;
        };
        Returns: undefined;
      };
      set_member_role: {
        Args: {
          p_room_id: string;
          p_user_id: string;
          p_role: Exclude<RoomRole, "owner">;
        };
        Returns: undefined;
      };
      transfer_room_ownership: {
        Args: {
          p_room_id: string;
          p_new_owner_id: string;
        };
        Returns: undefined;
      };
      is_room_member: {
        Args: { p_room_id: string };
        Returns: boolean;
      };
      get_room_role: {
        Args: { p_room_id: string };
        Returns: RoomRole | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type PlaybackEventPayload = {
  id: string;
  clientEventId: string;
  roomId: string;
  soundId: string | null;
  userId: string;
  userDisplayName: string;
  action: PlaybackAction;
  volume: number;
  createdAt: string;
};

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";
