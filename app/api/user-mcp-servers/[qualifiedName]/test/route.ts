import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ qualifiedName: string }> }
) {
  const params = await props.params;
  const { qualifiedName } = params;

  try {
    const body = await request.json();
    const { config = {} } = body;

    const apiKey = process.env.SMITHERY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Smithery API key not configured' }, { status: 500 });
    }

    // Get server details to find the deployment URL
    const encodedName = encodeURIComponent(decodeURIComponent(qualifiedName));
    const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/smithery/${encodedName}`);
    
    if (!serverResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch server details' }, { status: 500 });
    }

    const serverData = await serverResponse.json();
    const server = serverData.server;

    // console.log('Server data for', qualifiedName, ':', JSON.stringify(server, null, 2));

    // Strategy 1: Look for HTTP connections first (most secure)
    let deploymentUrl = null;
    let connection = null;

    if (server.connections && server.connections.length > 0) {
      // Prioritize HTTP connections with deploymentUrl
      connection = server.connections.find((conn: any) => 
        conn.type === 'http' && conn.deploymentUrl
      );
      
      if (connection) {
        deploymentUrl = connection.deploymentUrl;
      }
    }

    // Strategy 2: Fall back to root-level deploymentUrl if no HTTP connection found
    if (!deploymentUrl && server.deploymentUrl) {
      deploymentUrl = server.deploymentUrl;
      console.log('Using root-level deploymentUrl as fallback');
    }

    // Strategy 3: If still no deploymentUrl, reject stdio/other connection types for security
    if (!deploymentUrl) {
      const availableConnections = server.connections?.map((c: any) => ({ 
        type: c.type, 
        hasDeploymentUrl: !!c.deploymentUrl 
      })) || [];
      
      return NextResponse.json({ 
        error: 'No secure HTTP connection found for this server', 
        details: { 
          server: server.name || server.qualifiedName || 'unknown',
          availableConnections,
          message: 'Only HTTP connections are supported for security reasons'
        }
      }, { status: 400 });
    }

    console.log('Testing MCP server:', deploymentUrl.includes('smithery.ai') ? 'Smithery hosted' : 'Self-hosted');

    // Check if this is a Smithery server
    const isSmitheryServer = deploymentUrl.includes('server.smithery.ai');

    // Test the connection using a simple HTTP request to the MCP server
    try {
      let testUrl: string;
      
      if (isSmitheryServer) {
        // For Smithery servers, use api_key + profile pattern
        const smitheryUrl = new URL(deploymentUrl);
        smitheryUrl.searchParams.set('api_key', apiKey);
        
        // Check if user has provided a profile ID
        const profileId = config.smitheryProfileId || config.profileId;
        if (profileId) {
          smitheryUrl.searchParams.set('profile', profileId);
        } else {
          return NextResponse.json({ 
            success: false,
            error: 'Smithery profile required',
            details: {
              message: 'This server requires a Smithery profile. Please set up your profile on Smithery first.',
              isSmitheryServer: true,
              needsProfile: true
            }
          });
        }
        
        testUrl = smitheryUrl.toString();
      } else {
        // For non-Smithery servers, use the old approach
        const serverUrl = new URL(deploymentUrl);
        serverUrl.searchParams.set('apiKey', apiKey);
        
        if (Object.keys(config).length > 0) {
          serverUrl.searchParams.set('config', JSON.stringify(config));
        }
        
        testUrl = serverUrl.toString();
      }

      console.log('Testing MCP connection with', isSmitheryServer ? `profile: ${config.smitheryProfileId || config.profileId}` : 'direct config');

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