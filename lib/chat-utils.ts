import OpenAI from 'openai'

const openai = new OpenAI()

export async function generateChatName(conversation: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates concise chat titles. Create a clear and descriptive title that captures the main topic or purpose of the conversation. The title should be 2-4 words maximum.'
        },
        {
          role: 'user',
          content: `Based on this conversation, generate a short, descriptive title:\n\n${conversation}`
        }
      ],
      temperature: 0.7,
      max_tokens: 20,
    })

    const title = response.choices[0]?.message?.content?.trim() || 'New Chat'
    // Remove any quotes that might be in the response
    return title.replace(/["']/g, '')
  } catch (error) {
    console.error('Error generating chat name:', error)
    return 'New Chat'
  }
} 