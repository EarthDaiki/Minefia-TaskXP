export type SettingsPageId =
    | "root"
    | "api_keys"
    | "tag";

export type ApiKeyPageId =
    | "root"
    | "add_api_key"
    | "delete_api_key";

export type TagPageId = 
    | "root"

type SettingsSection = {
  id: string;
  label: string | null;
  items: {
    id: SettingsPageId;
    label: string;
  }[];
};

type ApiKeySection = {
  id: string;
  label: string | null;
  items: {
    id: ApiKeyPageId;
    label: string;
  }[];
};

type TagSection = {
  id: string;
  label: string | null;
  items: {
    id: TagPageId;
    label: string;
  }[];
};

export const settingsRootSections = [
    {
        id: "api_section",
        label: null,
        items: [
            { id: "api_keys", label: "API Keys" },
        ],
    },
    {
        id: "tag_section",
        label: null,
        items: [
            { id: "tag", label: "Tag Management" },
        ],
    },
] satisfies SettingsSection[];

export const settingsApiKeysSections = [
    {
        id: "add_api",
        label: null,
        items: [
            { id: "add_api_key", label: "Add API Key" },
        ],
    },
    {
        id: "delete_api",
        label: null,
        items: [
            { id: "delete_api_key", label: "Delete API Key" },
        ],
    },
] satisfies ApiKeySection[];

export const settingsTagSections = [

] satisfies TagSection[];
