import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { qualifiedName: string } }
) {
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

    if (!server.connections || server.connections.length === 0) {
      return NextResponse.json({ error: 'No connection configuration found for this server' }, { status: 400 });
    }

    const connection = server.connections[0]; // Use the first connection
    const deploymentUrl = connection.deploymentUrl;

    if (!deploymentUrl) {
      return NextResponse.json({ error: 'No deployment URL found for this server' }, { status: 400 });
    }

    // Test the connection using a simple HTTP request to the MCP server
    try {
      // Create the Smithery URL with config
      const smitheryUrl = new URL(deploymentUrl);
      smitheryUrl.searchParams.set('apiKey', apiKey);
      
      if (Object.keys(config).length > 0) {
        smitheryUrl.searchParams.set('config', JSON.stringify(config));
      }

      // Make a simple test request to the MCP server
      const testResponse = await fetch(smitheryUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'AgentHub',
              version: '1.0.0'
            }
          }
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (testResponse.ok) {
        const responseData = await testResponse.json();
        
        // Check if it's a valid MCP response
        if (responseData.jsonrpc === '2.0' && responseData.result) {
          return NextResponse.json({ 
            success: true,
            message: 'Connection test successful',
            serverCapabilities: responseData.result.capabilities || {}
          });
        } else if (responseData.error) {
          return NextResponse.json({ 
            success: false,
            error: `Server error: ${responseData.error.message || 'Unknown error'}`,
            details: responseData.error
          });
        } else {
          return NextResponse.json({ 
            success: false,
            error: 'Invalid response from server',
            details: responseData
          });
        }
      } else {
        const errorText = await testResponse.text();
        return NextResponse.json({ 
          success: false,
          error: `HTTP ${testResponse.status}: ${testResponse.statusText}`,
          details: errorText
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