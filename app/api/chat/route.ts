import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, AIProvider } from '@/app/types';
import { GEMINI_TOOLS, CLAUDE_TOOLS, OPENAI_FUNCTIONS, formatGeminiFunctionResponse, executeTool } from '@/app/lib/mcpTools';
import { getApiKeys } from '@/app/lib/serverEncryption';

// System prompt used across all AI providers
const SYSTEM_PROMPT = `
# Role
You are a friendly learning assistant. Your goal is to guide the user step-by-step whenever they want to learn something new.

# Core Principles
1. Beginner's Perspective: Assume the user is unfamiliar with the topic.
2. Clarity: Minimize jargon, and be sure to explain technical terms when used.
3. Step-by-Step Approach: Break down complex content into smaller steps.
4. Practicality: Focus more on practical, actionable methods than on theory.

# Tool Usage - CRITICAL INSTRUCTIONS
- You MUST use youtube_search and web_search functions for EVERY user request
- Call BOTH functions for every query:
  1. youtube_search - find video tutorials with korean (query in Korean)
  2. web_search - find articles, guides, blog and written tutorials with korean (query in Korean)
- Make the function calls FIRST, BEFORE writing any explanation
- The resources you find will be displayed to the user automatically

## Search Query Creation
**Extract key terms from user input and create natural Korean search queries:**

### Rules:
1. Identify the core subject/action from user's message
2. Convert to natural search phrase:
  - Examples:
  > For how-to questions: "[주제] + 하는 법" or "[주제] + 방법"
  > For recommendations: "[주제] + 추천"
  > For recipes: "[음식명] + 만드는 법" or "레시피"
  > For guides: "[주제] + 가이드" or "초보자"
  > For reviews: "[제품명] + 후기" or "사용기"

#### For youtube_search:
- Keep it concise and natural
- Focus on the main topic + learning intent

#### For web_search:
- Same principle as youtube_search
- Can add "후기" if user wants reviews/experiences

# BANNED vague phrases:
- "적당히", "충분히", "잘", "제대로" 
- "좋은/적당한 크기/정도/시간"
- "조금", "약간" (without numbers)

# REQUIRED in every instruction:
- Exact measurements: times, amounts, sizes, numbers
- Observable criteria: "until X happens", "when you see Y"
- Concrete comparisons: "thumb-sized", "as long as..."
- If exact number impossible, give range + reason

# Response Structure
1. Use your tools to find resources first
2. Brief Summary (2-3 sentences): State the core information
3. Detailed Explanation: Explain step-by-step carefully
4. Reference the resources you found (videos and articles)
5. Tips and Cautions: Highlight common pitfalls for beginners
6. Suggested Next Steps: Propose further learning opportunities

# Constraints
- Do not provide uncertain information
- Always include safety warnings for dangerous activities
- Prioritize beginner-friendly materials
- Prioritize Korean resources if available
`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory, provider = 'openai' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get API keys (from cookies or env)
    const keys = await getApiKeys();

    // Route to the appropriate AI provider
    switch (provider) {
      case 'openai':
        if (!keys.openaiApiKey) {
          return NextResponse.json(
            { error: 'OpenAI API key not configured. Please add it in Settings.' },
            { status: 500 }
          );
        }
        return await handleOpenAI(message, conversationHistory, keys.openaiApiKey, keys);

      case 'claude':
        if (!keys.anthropicApiKey) {
          return NextResponse.json(
            { error: 'Anthropic API key not configured. Please add it in Settings.' },
            { status: 500 }
          );
        }
        return await handleAnthropic(message, conversationHistory, keys.anthropicApiKey, keys);

      case 'gemini':
        if (!keys.geminiApiKey) {
          return NextResponse.json(
            { error: 'Gemini API key not configured. Please add it in Settings.' },
            { status: 500 }
          );
        }
        return await handleGemini(message, conversationHistory, keys.geminiApiKey, keys);

      default:
        return NextResponse.json(
          { error: 'Invalid AI provider' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `${error}` },
      { status: 500 }
    );
  }
}

async function handleOpenAI(message: string, conversationHistory: any[] | undefined, apiKey: string, keys: any) {
  const messages: any[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    ...(conversationHistory || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: message,
    },
  ];

  let youtubeVideos: any[] = [];
  let searchResults: any[] = [];

  // First API call with tools
  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 3000,
      tools: OPENAI_FUNCTIONS,
      tool_choice: 'required', // Force OpenAI to use at least one tool
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error('OpenAI API request failed');
  }

  let data = await response.json();

  const responseMessage = data.choices[0]?.message;

  // Check if OpenAI wants to use tools
  if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
    // Add assistant's response to messages
    messages.push(responseMessage);

    // Execute all tool calls
    for (const toolCall of responseMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      try {
        const toolResult = await executeTool(toolName, toolArgs, {
          youtubeApiKey: keys.youtubeApiKey,
          googleSearchApiKey: keys.googleSearchApiKey,
          googleSearchEngineId: keys.googleSearchEngineId,
        });

        // Store results for frontend
        if (toolName === 'youtube_search') {
          youtubeVideos = toolResult;
        } else if (toolName === 'web_search') {
          searchResults = toolResult;
        }

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      } catch (error) {
        console.error(`Tool execution error for ${toolName}:`, error);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `Failed to execute ${toolName}` }),
        });
      }
    }

    // Second API call with tool results
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 3000,
        tools: OPENAI_FUNCTIONS,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI continuation error:', errorData);
      throw new Error('OpenAI continuation API request failed');
    }

    data = await response.json();
    console.log('OpenAI final response:', JSON.stringify(data, null, 2));
  }

  const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

  const chatResponse: ChatResponse = {
    message: aiMessage,
    youtubeVideos,
    searchResults,
  };

  return NextResponse.json(chatResponse);
}

async function handleAnthropic(message: string, conversationHistory: any[] | undefined, apiKey: string, keys: any) {
  const messages = [
    ...(conversationHistory || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: message,
    },
  ];

  let youtubeVideos: any[] = [];
  let searchResults: any[] = [];

  // First API call with tools
  let response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages,
      tools: CLAUDE_TOOLS,
      tool_choice: { type: 'any' }, // Force Claude to use at least one tool
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Anthropic API error:', errorData);
    throw new Error('Anthropic API request failed');
  }

  let data = await response.json();
  console.log('Claude initial response:', JSON.stringify(data, null, 2));

  // Check if Claude wants to use tools
  if (data.stop_reason === 'tool_use') {
    // Extract tool_use blocks
    const toolUseBlocks = data.content.filter((block: any) => block.type === 'tool_use');

    if (toolUseBlocks.length > 0) {
      // Add assistant's response to messages
      messages.push({
        role: 'assistant',
        content: data.content,
      });

      // Execute all tool calls
      const toolResults = [];

      for (const toolBlock of toolUseBlocks) {
        const toolName = toolBlock.name;
        const toolInput = toolBlock.input;

        console.log(`Executing Claude tool: ${toolName}`, toolInput);

        try {
          const toolResult = await executeTool(toolName, toolInput, {
            youtubeApiKey: keys.youtubeApiKey,
            googleSearchApiKey: keys.googleSearchApiKey,
            googleSearchEngineId: keys.googleSearchEngineId,
          });

          // Store results for frontend
          if (toolName === 'youtube_search') {
            youtubeVideos = toolResult;
          } else if (toolName === 'web_search') {
            searchResults = toolResult;
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: JSON.stringify(toolResult),
          });
        } catch (error) {
          console.error(`Tool execution error for ${toolName}:`, error);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: JSON.stringify({ error: `Failed to execute ${toolName}` }),
            is_error: true,
          });
        }
      }

      // Add tool results as user message
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Second API call with tool results
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages,
          tools: CLAUDE_TOOLS,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Claude continuation error:', errorData);
        throw new Error('Claude continuation API request failed');
      }

      data = await response.json();
      console.log('Claude final response:', JSON.stringify(data, null, 2));
    }
  }

  // Extract text response
  const aiMessage = data.content.find((block: any) => block.type === 'text')?.text || 'Sorry, I could not generate a response.';

  const chatResponse: ChatResponse = {
    message: aiMessage,
    youtubeVideos,
    searchResults,
  };

  return NextResponse.json(chatResponse);
}

async function handleGemini(message: string, conversationHistory: any[] | undefined, apiKey: string, keys: any) {
  // Add system instruction as the first message in history
  const systemMessage = {
    role: 'user',
    parts: [{ text: SYSTEM_PROMPT }],
  };

  const history = (conversationHistory || []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Only include system instruction if there's no history
  const contents: any[] = history.length === 0
    ? [systemMessage, { role: 'user', parts: [{ text: message }] }]
    : [...history, { role: 'user', parts: [{ text: message }] }];

  let youtubeVideos: any[] = [];
  let searchResults: any[] = [];

  // First API call with function declarations
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        tools: GEMINI_TOOLS,
        toolConfig: {
          functionCallingConfig: {
            mode: 'ANY', // Force Gemini to use at least one tool
          },
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    throw new Error('Gemini API request failed');
  }

  let data = await response.json();
  console.log('Gemini initial response:', JSON.stringify(data, null, 2));

  // Check if there are function calls in the response
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const functionCalls = parts.filter((part: any) => part.functionCall);

  if (functionCalls.length > 0) {
    // Add model's response with function calls to contents
    contents.push(candidate.content);

    // Execute all function calls
    const functionResponses = [];

    for (const part of functionCalls) {
      const functionName = part.functionCall.name;
      const functionArgs = part.functionCall.args;

      console.log(`Executing Gemini function: ${functionName}`, functionArgs);

      try {
        const toolResult = await executeTool(functionName, functionArgs, {
          youtubeApiKey: keys.youtubeApiKey,
          googleSearchApiKey: keys.googleSearchApiKey,
          googleSearchEngineId: keys.googleSearchEngineId,
        });

        // Store results for frontend
        if (functionName === 'youtube_search') {
          youtubeVideos = toolResult;
        } else if (functionName === 'web_search') {
          searchResults = toolResult;
        }

        functionResponses.push(formatGeminiFunctionResponse(functionName, toolResult));
      } catch (error) {
        console.error(`Function execution error for ${functionName}:`, error);
        functionResponses.push(formatGeminiFunctionResponse(functionName, { error: `Failed to execute ${functionName}` }));
      }
    }

    // Add function responses to contents
    contents.push({
      role: 'function',
      parts: functionResponses,
    });

    // Second API call with function results
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          tools: GEMINI_TOOLS,
          toolConfig: {
            functionCallingConfig: {
              mode: 'AUTO', // Let Gemini decide (usually will respond with text after getting tool results)
            },
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini continuation error:', errorData);
      throw new Error('Gemini continuation API request failed');
    }

    data = await response.json();
    console.log('Gemini final response:', JSON.stringify(data, null, 2));
  }

  const aiMessage =
    data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ||
    'Sorry, I could not generate a response.';

  const chatResponse: ChatResponse = {
    message: aiMessage,
    youtubeVideos,
    searchResults,
  };

  return NextResponse.json(chatResponse);
}


