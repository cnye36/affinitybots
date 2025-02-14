import { Tool } from "@langchain/core/tools";
import { TwitterApi } from "twitter-api-v2";
import { IntegrationToolConfig, TwitterActions } from "@/types";

interface TwitterToolInterface {
  call(input: string): Promise<string>;
}

export class TwitterTool extends Tool {
  name = "twitter";
  description =
    "A tool for interacting with Twitter/X.com. Use this for posting tweets, creating threads, and other Twitter interactions.";

  private client: TwitterApi;
  private config: IntegrationToolConfig;
  private postTweetTool?: TwitterToolInterface;
  private createThreadTool?: TwitterToolInterface;
  private sendDmTool?: TwitterToolInterface;
  private likeTweetTool?: TwitterToolInterface;
  private retweetTool?: TwitterToolInterface;

  constructor(config: IntegrationToolConfig) {
    super();
    this.config = config;

    if (
      !config.credentials.api_key ||
      !config.credentials.api_secret ||
      !config.credentials.access_token ||
      !config.credentials.access_token_secret
    ) {
      throw new Error(
        "Twitter credentials (api_key, api_secret, access_token, access_token_secret) are required"
      );
    }

    this.client = new TwitterApi({
      appKey: config.credentials.api_key,
      appSecret: config.credentials.api_secret,
      accessToken: config.credentials.access_token,
      accessSecret: config.credentials.access_token_secret,
    });

    // Initialize Twitter tools
    this.initializeTools();
  }

  private initializeTools() {
    // Initialize post tweet tool
    this.postTweetTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const tweet = await this.client.v2.tweet(params.text, {
          reply: params.reply_to
            ? { in_reply_to_tweet_id: params.reply_to }
            : undefined,
        });
        return JSON.stringify(tweet.data);
      },
    };

    // Initialize thread creation tool
    this.createThreadTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const thread = await this.client.v2.tweetThread(params.tweets);
        return JSON.stringify(thread);
      },
    };

    // Initialize DM tool
    this.sendDmTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const dm = await this.client.v2.sendDmToParticipant(
          params.recipient_id,
          { text: params.text }
        );
        return JSON.stringify(dm);
      },
    };

    // Initialize like tweet tool
    this.likeTweetTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const like = await this.client.v2.like(
          await this.client.currentUserV2().then((user) => user.data.id),
          params.tweet_id
        );
        return JSON.stringify(like);
      },
    };

    // Initialize retweet tool
    this.retweetTool = {
      call: async (input: string) => {
        const params = JSON.parse(input);
        const retweet = await this.client.v2.retweet(
          await this.client.currentUserV2().then((user) => user.data.id),
          params.tweet_id
        );
        return JSON.stringify(retweet);
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
    type: keyof TwitterActions;
    params: Record<string, unknown>;
  }): Promise<string> {
    switch (action.type) {
      case "postTweet":
        return await this.postTweetTool!.call(JSON.stringify(action.params));
      case "createThread":
        return await this.createThreadTool!.call(JSON.stringify(action.params));
      case "sendDirectMessage":
        return await this.sendDmTool!.call(JSON.stringify(action.params));
      case "likeTweet":
        return await this.likeTweetTool!.call(JSON.stringify(action.params));
      case "retweet":
        return await this.retweetTool!.call(JSON.stringify(action.params));
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
