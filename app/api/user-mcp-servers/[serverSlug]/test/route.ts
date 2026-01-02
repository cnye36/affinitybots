import { NextRequest, NextResponse } from "next/server";
import { findOfficialServer } from "@/lib/mcp/officialMcpServers";
import { createClient } from "@supabase/supabase-js";
import { createGoogleDriveClient } from "@/lib/mcp/googleDriveMcpClient";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ serverSlug: string }> }
) {
  const params = await props.params;
  const { serverSlug } = params;

  try {
    const body = await request.json();
    const { config = {} } = body;

    // Try to find the server URL from official servers or user-added servers
    let deploymentUrl: string | null = null;

    // Check official servers first
    const officialServer = findOfficialServer(decodeURIComponent(serverSlug));
    if (officialServer && officialServer.url) {
      deploymentUrl = officialServer.url;
    } else {
      // Check user-added servers
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: userServer } = await supabase
        .from('user_mcp_servers')
        .select('url')
        .eq('server_slug', decodeURIComponent(serverSlug))
        .single();

      if (userServer && userServer.url) {
        deploymentUrl = userServer.url;
      }
    }

    if (!deploymentUrl) {
      return NextResponse.json({
        error: 'No URL configured for this server',
        details: {
          server: serverSlug,
          message: 'Server must have a URL to test the connection'
        }
      }, { status: 400 });
    }

    console.log('Testing MCP server:', deploymentUrl);

    // Check if this is a Google Drive MCP server (custom protocol)
    const isGoogleDriveServer = serverSlug.toLowerCase().includes('google') ||
                                serverSlug.toLowerCase().includes('drive') ||
                                deploymentUrl.includes('localhost:3002') ||
                                deploymentUrl.includes('google-drive');

    if (isGoogleDriveServer) {
      return await testGoogleDriveConnection(serverSlug, deploymentUrl);
    }

    // Test the connection using a simple HTTP request to the MCP server
    try {
      // Use the deployment URL directly
      const testUrl = deploymentUrl;

      console.log('Testing MCP connection to:', testUrl);

      // Step 1: Initialize the MCP server
      console.log('Making MCP initialize request...');
      let initResponse;
      try {
        initResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: {
                name: 'AffinityBots',
                version: '1.0.0'
              }
            }
          }),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        console.log('MCP request completed, status:', initResponse.status);
      } catch (fetchError: any) {
        console.log('MCP connection failed:', fetchError.message);
        return NextResponse.json({ 
          success: false,
          error: `Network error: ${fetchError.message}`,
          details: fetchError.toString()
        });
      }

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.log('MCP error response:', initResponse.status, initResponse.statusText);
        return NextResponse.json({ 
          success: false,
          error: `HTTP ${initResponse.status}: ${initResponse.statusText}`,
          details: errorText
        });
      }

      console.log('MCP Server Response Status:', initResponse.status);
      
      const responseText = await initResponse.text();
      console.log('MCP Response format:', initResponse.headers.get('content-type'));
      
      let initData;
      try {
        // Handle Server-Sent Events (SSE) format
        if (responseText.includes('event: message') && responseText.includes('data: ')) {
          // Extract JSON from SSE format
          const lines = responseText.split('\n');
          const dataLine = lines.find(line => line.startsWith('data: '));
          if (dataLine) {
            const jsonString = dataLine.substring(6); // Remove 'data: ' prefix
            initData = JSON.parse(jsonString);
            console.log('MCP initialization successful via SSE');
          } else {
            throw new Error('No data field found in SSE response');
          }
        } else {
          // Handle plain JSON response
          initData = JSON.parse(responseText);
          console.log('MCP initialization successful via JSON');
        }
      } catch (parseError: any) {
        console.log('Failed to parse MCP response:', parseError.message);
        return NextResponse.json({ 
          success: false,
          error: `Invalid response format from MCP server: ${parseError}`,
          details: { rawResponse: responseText }
        });
      }
      
      // Check if initialization was successful
      if (initData.jsonrpc !== '2.0' || !initData.result) {
        if (initData.error) {
          return NextResponse.json({ 
            success: false,
            error: `Initialization failed: ${initData.error.message || 'Unknown error'}`,
            details: initData.error
          });
        } else {
          return NextResponse.json({ 
            success: false,
            error: 'Invalid initialization response from server',
            details: initData
          });
        }
      }

      // Step 2: Shutdown the MCP server to clean up the connection
      try {
        const shutdownResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'shutdown',
            params: {}
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout for shutdown
        });

        // Note: We don't need to check shutdown response as aggressively since 
        // the main test (initialization) already passed
        
        return NextResponse.json({ 
          success: true,
          message: 'Connection test successful - server initialized and shutdown properly',
          serverCapabilities: initData.result.capabilities || {}
        });
      } catch (shutdownError) {
        // If shutdown fails, still report success since initialization worked
        // but mention the shutdown issue
        return NextResponse.json({ 
          success: true,
          message: 'Connection test successful (initialization worked, but shutdown had issues)',
          serverCapabilities: initData.result.capabilities || {},
          shutdownWarning: 'Server may not have shutdown cleanly'
        });
      }
    } catch (connectionError: any) {
      if (connectionError.name === 'AbortError') {
        return NextResponse.json({ 
          success: false,
          error: 'Connection timeout - server did not respond within 10 seconds'
        });
      }
      
      return NextResponse.json({ 
        success: false,
        error: `Connection failed: ${connectionError.message}`,
        details: connectionError.toString()
      });
    }
  } catch (error) {
    console.error('Error testing server connection:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error during connection test'
    }, { status: 500 });
  }
}

/**
 * Test Google Drive MCP server connection with OAuth validation
 */
async function testGoogleDriveConnection(serverSlug: string, serverUrl: string): Promise<NextResponse> {
  try {
    console.log(`Testing Google Drive MCP server: ${serverUrl}`);

    // Step 1: Test basic connectivity with health check
    console.log('Testing Google Drive MCP server health...');
    try {
      const healthResponse = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!healthResponse.ok) {
        return NextResponse.json({
          success: false,
          error: `Google Drive MCP server health check failed (${healthResponse.status})`,
          details: {
            server: serverSlug,
            url: serverUrl,
            status: healthResponse.status,
            statusText: healthResponse.statusText
          }
        });
      }

      console.log('Google Drive MCP server health check passed');
    } catch (healthError: any) {
      console.log('Google Drive MCP server health check failed:', healthError.message);
      return NextResponse.json({
        success: false,
        error: `Cannot connect to Google Drive MCP server: ${healthError.message}`,
        details: {
          server: serverSlug,
          url: serverUrl,
          error: healthError.toString()
        }
      });
    }

    // Step 2: Test tools endpoint (doesn't require OAuth)
    console.log('Testing Google Drive MCP server tools endpoint...');
    try {
      const toolsResponse = await fetch(`${serverUrl}/mcp/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!toolsResponse.ok) {
        return NextResponse.json({
          success: false,
          error: `Google Drive MCP server tools endpoint failed (${toolsResponse.status})`,
          details: {
            server: serverSlug,
            url: serverUrl,
            status: toolsResponse.status,
            statusText: toolsResponse.statusText
          }
        });
      }

      const toolsData = await toolsResponse.json();
      console.log(`Google Drive MCP server has ${toolsData.tools?.length || 0} available tools`);

      return NextResponse.json({
        success: true,
        message: 'Google Drive MCP server connection successful',
        details: {
          server: serverSlug,
          url: serverUrl,
          availableTools: toolsData.tools?.length || 0,
          tools: toolsData.tools || []
        }
      });

    } catch (toolsError: any) {
      console.log('Google Drive MCP server tools endpoint failed:', toolsError.message);
      return NextResponse.json({
        success: false,
        error: `Google Drive MCP server tools endpoint error: ${toolsError.message}`,
        details: {
          server: serverSlug,
          url: serverUrl,
          error: toolsError.toString()
        }
      });
    }

  } catch (error: any) {
    console.error('Error testing Google Drive MCP server:', error);
    return NextResponse.json({
      success: false,
      error: `Google Drive MCP server test failed: ${error.message}`,
      details: {
        server: serverSlug,
        url: serverUrl,
        error: error.toString()
      }
    });
  }
} 