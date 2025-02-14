import { Tool } from "@langchain/core/tools";
import { IntegrationToolConfig } from "@/types";
import { google } from "googleapis";

interface GoogleToolInterface {
  call(input: string): Promise<string>;
}

export class GoogleTool extends Tool {
  name = "google";
  description =
    "A tool for interacting with Google services including Gmail and Calendar.";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private auth: any; // We'll keep this as any since the google.auth.OAuth2 type is complex
  private config: IntegrationToolConfig;
  private calendarCreateTool?: GoogleToolInterface;
  private calendarViewTool?: GoogleToolInterface;
  private gmailCreateDraftTool?: GoogleToolInterface;
  private gmailSendTool?: GoogleToolInterface;
  private gmailSearchTool?: GoogleToolInterface;

  constructor(config: IntegrationToolConfig) {
    super();
    this.config = config;

    if (
      !config.credentials.client_id ||
      !config.credentials.client_secret ||
      !config.credentials.refresh_token
    ) {
      throw new Error(
        "Google credentials (client_id, client_secret, refresh_token) are required"
      );
    }

    this.auth = new google.auth.OAuth2(
      config.credentials.client_id,
      config.credentials.client_secret
    );

    this.auth.setCredentials({
      refresh_token: config.credentials.refresh_token,
    });

    // Initialize Google tools
    this.initializeTools();
  }

  private async initializeTools() {
    const calendar = google.calendar({ version: "v3", auth: this.auth });
    const gmail = google.gmail({ version: "v1", auth: this.auth });

    // Initialize tools with the API clients
    this.calendarCreateTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: params,
        });
        return JSON.stringify(response.data);
      },
    };

    this.calendarViewTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const response = await calendar.events.list({
          calendarId: "primary",
          ...params,
        });
        return JSON.stringify(response.data);
      },
    };

    this.gmailCreateDraftTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const response = await gmail.users.drafts.create({
          userId: "me",
          requestBody: params,
        });
        return JSON.stringify(response.data);
      },
    };

    this.gmailSendTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: params,
        });
        return JSON.stringify(response.data);
      },
    };

    this.gmailSearchTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const response = await gmail.users.messages.list({
          userId: "me",
          q: params.query,
        });
        return JSON.stringify(response.data);
      },
    };
  }

  async _call(input: string): Promise<string> {
    try {
      const action = JSON.parse(input);
      return await this.handleAction(action);
    } catch (error) {
      throw new Error(`Failed to parse input as JSON: ${error}`);
    }
  }

  private async handleAction(action: {
    type:
      | "createEvent"
      | "viewEvents"
      | "createDraft"
      | "sendEmail"
      | "searchEmails";
    params: Record<string, unknown>;
  }): Promise<string> {
    switch (action.type) {
      case "createEvent":
        return await this.calendarCreateTool!.call(
          JSON.stringify(action.params)
        );
      case "viewEvents":
        return await this.calendarViewTool!.call(JSON.stringify(action.params));
      case "createDraft":
        return await this.gmailCreateDraftTool!.call(
          JSON.stringify(action.params)
        );
      case "sendEmail":
        return await this.gmailSendTool!.call(JSON.stringify(action.params));
      case "searchEmails":
        return await this.gmailSearchTool!.call(JSON.stringify(action.params));
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
