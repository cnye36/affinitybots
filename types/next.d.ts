import { NextRequest } from "next/server";

declare module "next/server" {
  // Extend the RouteHandlerContext interface
  interface RouteHandlerContext {
    params: Record<string, string>;
  }

  // Define the route handler function types
  type RouteHandler<T = unknown> = (
    request: NextRequest,
    context: { params: Record<string, string> }
  ) => Response | Promise<Response | T>;
}
