import { WebBrowser } from "langchain/tools/webbrowser"
import { Calculator } from "@langchain/community/tools/calculator"
import { Tool } from "langchain/tools"
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { searchSimilar } from '../qdrant'
import { DynamicTool } from "langchain/tools"

export async function initializeTools(toolIds: string[], config: Record<string, any> = {}) {
  const tools: Tool[] = []
  
  for (const toolId of toolIds) {
    switch (toolId) {
      case 'web_search':
        // Initialize search tool
        const searchTool = new WebBrowser({
          model: new ChatOpenAI({ modelName: "gpt-4o" }),
          embeddings: new OpenAIEmbeddings(),
        })
        tools.push(searchTool)
        break
        
      case 'web_scraper':
        // Initialize scraper with custom configuration
        const scraperTool = new WebBrowser({
          model: new ChatOpenAI({ modelName: "gpt-4o" }),
          embeddings: new OpenAIEmbeddings(),
        })
        tools.push(scraperTool)
        break
        
      case 'calculator':
        tools.push(new Calculator())
        break
        
      case 'knowledge_retrieval':
        tools.push(
          new DynamicTool({
            name: "knowledge_base",
            description: "Search through the knowledge base for relevant information",
            func: async (query: string) => {
              const results = await searchSimilar(
                query,
                config[toolId]?.collection || 'default',
                config[toolId]?.limit || 5
              )
              return results.map((r: any) => r.pageContent).join('\n\n')
            },
          })
        )
        break
        
      // Add more tool initializations here
    }
  }
  
  return tools
} 