import { NextRequest, NextResponse } from "next/server";
import { findOfficialServer } from "@/lib/mcp/officialMcpServers";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ qualifiedName: string }> }
) {
  const params = await props.params;
  const { qualifiedName } = params;

  try {
    const body = await request.json();
    const { config = {} } = body;

    // Try to find the server URL from official servers or user-added servers
    let deploymentUrl: string | null = null;
    
    // Check official servers first
    const officialServer = findOfficialServer(decodeURIComponent(qualifiedName));
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
        .eq('qualified_name', decodeURIComponent(qualifiedName))
        .single();
      
      if (userServer && userServer.url) {
        deploymentUrl = userServer.url;
      }
    }

    if (!deploymentUrl) {
      return NextResponse.json({ 
        error: 'No URL configured for this server', 
        details: { 
          server: qualifiedName,
          message: 'Server must have a URL to test the connection'
        }
      }, { status: 400 });
    }

    console.log('Testing MCP server:', deploymentUrl);

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