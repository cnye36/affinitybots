import { Client } from "@notionhq/client";
import { Tool } from "@langchain/core/tools";
import { NotionActions, IntegrationToolConfig } from "@/types";
import {
  CreatePageParameters,
  UpdatePageParameters,
  SearchParameters,
} from "@notionhq/client/build/src/api-endpoints";

export class NotionTool extends Tool {
  name = "notion";
  description =
    "A tool for interacting with Notion. Use this for creating, updating, and searching Notion pages and databases.";

  private client: Client;
  private config: IntegrationToolConfig;

  constructor(config: IntegrationToolConfig) {
    super();
    this.config = config;

    if (!config.credentials.api_key) {
      throw new Error("Notion API key is required");
    }

    this.client = new Client({
      auth: config.credentials.api_key,
    });
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      const action = JSON.parse(input) as {
        type: keyof NotionActions;
        params: Record<string, unknown>;
      };
      return await this.handleAction(action);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return "An unknown error occurred";
    }
  }

  private async handleAction(action: {
    type: keyof NotionActions;
    params: Record<string, unknown>;
  }): Promise<string> {
    switch (action.type) {
      case "createPage":
        return await this.createPage(
          action.params as Parameters<NotionActions["createPage"]>[0]
        );
      case "updatePage":
        return await this.updatePage(
          action.params as Parameters<NotionActions["updatePage"]>[0]
        );
      case "addToDatabase":
        return await this.addToDatabase(
          action.params as Parameters<NotionActions["addToDatabase"]>[0]
        );
      case "search":
        return await this.search(
          action.params as Parameters<NotionActions["search"]>[0]
        );
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async createPage(
    params: Parameters<NotionActions["createPage"]>[0]
  ): Promise<string> {
    const { title, content, parent } = params;

    const pageParams: CreatePageParameters = {
      parent: parent?.database_id
        ? { database_id: parent.database_id, type: "database_id" }
        : parent?.page_id
        ? { page_id: parent.page_id, type: "page_id" }
        : {
            page_id: this.config.credentials.workspace_id || "",
            type: "page_id",
          },
      properties: {
        title: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content,
                },
              },
            ],
          },
        },
      ],
    };

    const response = await this.client.pages.create(pageParams);
    return `Created page with ID: ${response.id}`;
  }

  private async updatePage(
    params: Parameters<NotionActions["updatePage"]>[0]
  ): Promise<string> {
    const { page_id, properties } = params;

    const updateParams: UpdatePageParameters = {
      page_id,
      properties: Object.entries(properties).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            type: typeof value === "string" ? "rich_text" : "title",
            [typeof value === "string" ? "rich_text" : "title"]: [
              {
                type: "text",
                text: {
                  content: String(value),
                },
              },
            ],
          },
        }),
        {}
      ),
    };

    await this.client.pages.update(updateParams);
    return `Updated page with ID: ${page_id}`;
  }

  private async addToDatabase(
    params: Parameters<NotionActions["addToDatabase"]>[0]
  ): Promise<string> {
    const { database_id, properties } = params;

    const pageParams: CreatePageParameters = {
      parent: { database_id, type: "database_id" },
      properties: Object.entries(properties).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            type: typeof value === "string" ? "rich_text" : "title",
            [typeof value === "string" ? "rich_text" : "title"]: [
              {
                type: "text",
                text: {
                  content: String(value),
                },
              },
            ],
          },
        }),
        {}
      ),
    };

    const response = await this.client.pages.create(pageParams);
    return `Added entry to database with ID: ${response.id}`;
  }

  private async search(
    params: Parameters<NotionActions["search"]>[0]
  ): Promise<string> {
    const { query, filter } = params;

    const searchParams: SearchParameters = {
      query,
      filter: filter
        ? {
            property: "object",
            value: "page",
          }
        : undefined,
    };

    const response = await this.client.search(searchParams);
    return JSON.stringify(response.results);
  }
}
