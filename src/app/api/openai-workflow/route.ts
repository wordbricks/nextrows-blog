import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { sendToSlack } from '@/lib/slack';

// System prompt for the customer support assistant
const SYSTEM_PROMPT = `You are a helpful customer support assistant for HorizonTel Communications, a telecommunications company.

Your responsibilities include:
1. Helping customers with device returns and replacements
2. Managing subscription cancellations and retention offers
3. Explaining refund policies and processing
4. Assisting with billing inquiries and payment issues
5. Providing general customer support

Key policies:
- Returns: Offer replacement devices with free shipping (2-3 business days)
- Cancellations: Offer 20% discount for 12 months as retention
- Refunds: Full refunds within 30 days, prorated after
- Billing: Monthly cycles, can view/update in account dashboard

Be professional, empathetic, and concise. Always try to resolve issues and retain customers when appropriate.`;

// Demo responses for when OpenAI API is not available
const DEMO_RESPONSES: Record<string, string> = {
  "return": "I'd be happy to help you with your return! I can offer you a replacement device with free shipping. The replacement will be sent within 2-3 business days. Would you like to proceed with this option?",
  "cancel": "I understand you're considering cancellation. Before you go, I'd like to offer you a special 20% discount for the next 12 months. This would reduce your monthly bill significantly. Would this help address your concerns?",
  "refund": "Our refund policy allows for full refunds within 30 days of purchase. Refunds are processed to the original payment method within 7-10 business days. For accounts older than 30 days, we offer prorated refunds for unused services.",
  "billing": "I can help with your billing inquiry. You can view your current bill, payment history, and update payment methods in your account dashboard. Monthly bills are generated on your activation date. Is there a specific billing issue I can help resolve?",
  "default": "Thank you for contacting customer support. I'm here to help with returns, cancellations, refunds, and billing inquiries. How can I assist you today?"
};

function classifyIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('return') || lowerMessage.includes('device') || lowerMessage.includes('replacement')) {
    return 'return';
  }
  if (lowerMessage.includes('cancel') || lowerMessage.includes('subscription') || lowerMessage.includes('unsubscribe')) {
    return 'cancel';
  }
  if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
    return 'refund';
  }
  if (lowerMessage.includes('billing') || lowerMessage.includes('bill') || lowerMessage.includes('payment') || lowerMessage.includes('charge')) {
    return 'billing';
  }
  return 'default';
}

export async function POST(request: NextRequest) {
  try {
    const { input_as_text } = await request.json();

    // Log incoming request
    console.log('🔵 [CHAT REQUEST]', {
      timestamp: new Date().toISOString(),
      userMessage: input_as_text,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
    });

    if (!input_as_text) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Use demo mode if no API key
      console.log("No OpenAI API key found, using demo mode");
      const intent = classifyIntent(input_as_text);
      const response = DEMO_RESPONSES[intent] || DEMO_RESPONSES.default;

      // Log demo response
      console.log('🟡 [CHAT RESPONSE - Demo]', {
        timestamp: new Date().toISOString(),
        userMessage: input_as_text.substring(0, 50) + '...',
        aiResponse: response.substring(0, 50) + '...',
        intent: intent,
        demo: true
      });

      // Send to Slack
      await sendToSlack(input_as_text, response, {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        demo: true
      });

      return NextResponse.json({
        message: response,
        intent: intent,
        demo: true
      });
    }

    // Use OpenAI API for real responses
    try {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input_as_text }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      // Log successful OpenAI response
      console.log('🟢 [CHAT RESPONSE - OpenAI]', {
        timestamp: new Date().toISOString(),
        userMessage: input_as_text.substring(0, 50) + '...',
        aiResponse: response.substring(0, 50) + '...',
        model: 'gpt-4o-mini',
        demo: false
      });

      // Send to Slack
      await sendToSlack(input_as_text, response, {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        model: 'gpt-4o-mini',
        demo: false
      });

      return NextResponse.json({
        message: response,
        demo: false
      });

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);

      // Fall back to demo mode if OpenAI fails
      const intent = classifyIntent(input_as_text);
      const response = DEMO_RESPONSES[intent] || DEMO_RESPONSES.default;

      return NextResponse.json({
        message: response,
        intent: intent,
        demo: true,
        error: "OpenAI API error - using demo mode"
      });
    }

  } catch (error) {
    console.error("Error in workflow:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}