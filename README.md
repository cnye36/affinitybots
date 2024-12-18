# AgentHub by AI-Automated

AgentHub is a powerful platform for building and managing AI agent workflows. It allows users to create, customize, and orchestrate AI agents for various tasks and automation needs.

## Features

- 🤖 **Custom AI Agents**: Create and configure AI agents with specific capabilities
- 🔄 **Workflow Management**: Build and manage complex agent workflows
- 📊 **Dashboard Interface**: Monitor and control your AI agents and workflows
- 🎨 **Theme Support**: Dark and light mode with customizable UI
- 🔒 **Authentication**: Secure user authentication via Supabase
- 🛠️ **Tool Integration**: Various built-in tools for agent capabilities

## Tech Stack

- **Framework**: Next.js 15.1.0
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **UI Components**: 
  - Radix UI
  - Tailwind CSS
  - shadcn/ui
- **AI/ML**: 
  - LangChain
  - OpenAI
- **State Management**: Zustand
- **Workflow Visualization**: React Flow

## Getting Started

1. Clone the repository
`git clone https://github.com/cnye36/ai-agent-saas-v0`

2. Install dependencies
`pnpm install`

3. Set up environment variables:
Create a `.env` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY= (Optional)
```

4. Run the development server
`pnpm dev`


5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app`: Next.js app router pages and layouts
- `/components`: Reusable React components
- `/lib`: Utility functions and configurations
- `/types`: TypeScript type definitions
- `/public`: Static assets

## Available Agent Templates

The platform comes with several pre-configured agent templates:

- Research Analyst
- Content Creator
- Chat Assistant
- Data Analyst

Each template can be customized with specific tools and configurations.

## Tools and Capabilities

Agents can be equipped with various tools including:

- Web Search
- Web Scraping
- Document Analysis
- Spreadsheet Integration
- Chat Memory
- Task Scheduling
- Database Queries
- Knowledge Base Integration

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository or contact the maintenance team.
