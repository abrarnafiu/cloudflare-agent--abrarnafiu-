# 🤖 Cloudflare AI Chat Agent

A powerful, production-ready AI chat agent built with Cloudflare Workers and the `agents` package. This project demonstrates how to create intelligent conversational AI experiences with tool integration, task scheduling, and a modern React-based UI.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/cloudflare-agent--abrarnafiu-)

## ✨ Features

- **💬 Intelligent Chat Interface** - Real-time streaming conversations with AI
- **🛠️ Advanced Tool System** - Human-in-the-loop confirmation for sensitive operations
- **📅 Task Scheduling** - One-time, delayed, and recurring tasks with cron support
- **🌓 Theme Support** - Beautiful dark/light mode toggle
- **⚡️ Real-time Streaming** - Smooth, responsive chat experience
- **🔄 State Management** - Persistent chat history and agent state
- **🎨 Modern UI** - Clean, responsive design with Tailwind CSS
- **🔧 Debug Tools** - Built-in testing and debugging capabilities

## 🚀 Quick Start

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cloudflare-agent--abrarnafiu-.git
   cd cloudflare-agent--abrarnafiu-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.dev.vars` file in the project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

## 🏗️ Project Structure

```
├── src/
│   ├── app.tsx              # React chat interface
│   ├── server.ts            # AI agent implementation
│   ├── tools.ts             # Tool definitions and executions
│   ├── utils.ts             # Helper functions
│   ├── components/          # Reusable UI components
│   │   ├── avatar/
│   │   ├── button/
│   │   ├── card/
│   │   └── ...
│   └── styles.css           # Global styles
├── public/                  # Static assets
├── wrangler.jsonc          # Cloudflare Workers configuration
└── package.json
```

## 🛠️ Available Tools

The agent comes with several built-in tools:

### Automatic Tools (No Confirmation Required)
- **`getLocalTime`** - Get current time for any location
- **`scheduleTask`** - Schedule one-time, delayed, or recurring tasks
- **`getScheduledTasks`** - List all scheduled tasks
- **`cancelScheduledTask`** - Cancel tasks by ID

### Confirmation-Required Tools
- **`getWeatherInformation`** - Get weather data (requires user approval)

## 🔧 Customization

### Adding New Tools

1. **Define the tool** in `src/tools.ts`:

```typescript
// Auto-executing tool
const searchDatabase = tool({
  description: "Search the database for records",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().optional()
  }),
  execute: async ({ query, limit }) => {
    // Implementation here
    return results;
  }
});

// Confirmation-required tool
const sendEmail = tool({
  description: "Send an email to a recipient",
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string()
  })
  // No execute function = requires confirmation
});
```

2. **Add execution handler** for confirmation-required tools:

```typescript
export const executions = {
  sendEmail: async ({ to, subject, body }) => {
    // Implementation for confirmed action
    return await emailService.send({ to, subject, body });
  }
};
```

3. **Update the confirmation list** in `src/app.tsx`:

```typescript
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  "getWeatherInformation",
  "sendEmail" // Add your new tool here
];
```

### Using Different AI Providers

The project supports multiple AI providers. To switch from the default Workers AI:

1. **Install the provider**:
   ```bash
   npm install @ai-sdk/openai  # or @ai-sdk/anthropic
   ```

2. **Update the server** in `src/server.ts`:
   ```typescript
   import { openai } from "@ai-sdk/openai";
   
   // Replace the AI call
   const model = openai("gpt-4o");
   ```

3. **Add API key** to `.dev.vars`:
   ```env
   OPENAI_API_KEY=your_key_here
   ```

### Customizing the UI

The chat interface is built with React and can be customized:

- **Theme colors**: Modify `src/styles.css`
- **Components**: Add new components in `src/components/`
- **Layout**: Update `src/app.tsx`
- **Styling**: Uses Tailwind CSS for styling

## 📋 Example Use Cases

### Customer Support Agent
- Ticket creation and lookup
- Order status checking
- Product recommendations
- FAQ database search

### Development Assistant
- Code linting and formatting
- Git operations
- Documentation search
- Dependency management

### Personal Productivity
- Task scheduling and reminders
- Email drafting
- Note taking and organization
- Calendar management

### Data Analysis Assistant
- Database querying
- Data visualization
- Statistical analysis
- Report generation

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Test specific functionality:

```bash
# Test AI connectivity
curl https://your-worker.your-subdomain.workers.dev/test-ai

# Check available models
curl https://your-worker.your-subdomain.workers.dev/check-models
```

## 📚 API Reference

### Endpoints

- `GET /` - Chat interface
- `GET /test-ai` - Test AI connectivity
- `GET /check-models` - Check available AI models
- `POST /agents/chat` - Chat with the agent (WebSocket)

### WebSocket Events

- **Message**: Send chat messages
- **Tool Confirmation**: Confirm or reject tool executions
- **State Updates**: Real-time state synchronization

## 🔒 Security

- All sensitive operations require user confirmation
- API keys are stored as Cloudflare secrets
- Input validation using Zod schemas
- Rate limiting and error handling

## 🚀 Deployment

### Cloudflare Workers

1. **Login to Wrangler**:
   ```bash
   npx wrangler login
   ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```

3. **Set secrets**:
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```

### Environment Variables

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📖 Learn More

- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [AI SDK Documentation](https://sdk.vercel.ai/)
- [React Documentation](https://react.dev/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by the [agents](https://www.npmjs.com/package/agents) package
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Phosphor Icons](https://phosphoricons.com/)

---

**Made with ❤️ using Cloudflare Workers and the agents package**
