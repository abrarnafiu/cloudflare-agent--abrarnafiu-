import { routeAgentRequest, type Schedule } from "agents";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  type StreamTextOnFinishCallback,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
import { env } from "cloudflare:workers";

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    console.log('onChatMessage called with messages:', this.messages.length);
    
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };
    
    console.log('Available tools:', Object.keys(allTools));

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          // Clean up incomplete tool calls to prevent API errors
          const cleanedMessages = cleanupMessages(this.messages);

          // Process any pending tool calls from previous messages
          // This handles human-in-the-loop confirmations for tools
          const processedMessages = await processToolCalls({
            messages: cleanedMessages,
            dataStream: writer,
            tools: allTools,
            executions
          });

          console.log('Processing chat message...');
          console.log('Processed messages:', processedMessages.length);
          
          // Get the last user message
          const lastMessage = processedMessages[processedMessages.length - 1];
          const userMessage = lastMessage?.parts?.[0]?.type === 'text' ? 
            (lastMessage.parts[0] as any).text : "Hello!";
          
          console.log('User message:', userMessage);
          
          // Use direct Workers AI API with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI request timeout')), 15000)
          );
          
          const aiPromise = env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
            prompt: `You are a helpful assistant. Please respond to the user's message: ${userMessage}`
          });
          
          const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
          
          console.log('AI response:', aiResponse);
          
          // Handle different response formats from Workers AI
          let responseText = "I'm sorry, I couldn't generate a response.";
          if (typeof aiResponse === 'string') {
            responseText = aiResponse;
          } else if (aiResponse && typeof aiResponse === 'object') {
            const responseObj = aiResponse as any;
            responseText = responseObj.response || responseObj.text || responseObj.result || 
                          responseObj.choices?.[0]?.message?.content || 
                          JSON.stringify(aiResponse);
          }
          
          // Write the response to the stream in chunks to simulate streaming
          const words = responseText.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            writer.write({
              type: 'text-delta',
              delta: word,
              id: generateId()
            });
            
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          console.log('Response written to stream');
        } catch (error) {
          console.error('Error in AI call:', error);
          try {
            writer.write({
              type: 'text-delta',
              delta: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
              id: generateId()
            });
          } catch (writeError) {
            console.error('Error writing to stream:', writeError);
          }
        }
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Check available models
    if (url.pathname === "/check-models") {
      try {
        // Try to get available models (this might not work in all environments)
        return Response.json({ 
          success: true, 
          message: "AI binding is available",
          binding: !!env.AI
        });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    }
    
    // Test endpoint to verify Workers AI is working
    if (url.pathname === "/test-ai") {
      try {
        console.log('Testing Workers AI...');
        console.log('AI binding available:', !!env.AI);
        
        // First check if AI binding is available
        if (!env.AI) {
          return Response.json({ 
            success: false, 
            error: 'AI binding not available' 
          }, { status: 500 });
        }
        
        // Test with a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
        );
        
        // Try a very basic test first
        console.log('Attempting basic AI call...');
        
        // Try with a very simple model first
        const aiPromise = env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt: "Hello, how are you?"
        });
        
        const result = await Promise.race([aiPromise, timeoutPromise]) as any;
        
        console.log('AI test result:', result);
        
        // Handle different response formats
        let responseText = 'No response';
        if (typeof result === 'string') {
          responseText = result;
        } else if (result && typeof result === 'object') {
          const resultObj = result as any;
          responseText = resultObj.response || resultObj.text || resultObj.result || JSON.stringify(result);
        }
        
        return Response.json({ 
          success: true, 
          response: responseText,
          rawResult: result,
          usage: result.usage 
        });
      } catch (error) {
        console.error('AI test error:', error);
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    }
    
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
