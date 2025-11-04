import { tool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { z } from "zod";
import { OpenAI } from "openai";
import { runGuardrails } from "@openai/guardrails";


// Tool definitions
const getRetentionOffers = tool({
  name: "getRetentionOffers",
  description: "Retrieve possible retention offers for a customer",
  parameters: z.object({
    customer_id: z.string(),
    account_type: z.string(),
    current_plan: z.string(),
    tenure_months: z.integer(),
    recent_complaints: z.boolean()
  }),
  execute: async (input: {customer_id: string, account_type: string, current_plan: string, tenure_months: integer, recent_complaints: boolean}) => {
    // TODO: Unimplemented
  },
});

// Shared client for guardrails and file search
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Guardrails definitions
const jailbreakGuardrailConfig = {
  guardrails: [
    {
      name: "Jailbreak",
      config: {
        model: "gpt-5-nano",
        confidence_threshold: 0.7
      }
    }
  ]
};
const context = { guardrailLlm: client };

// Guardrails utils
function guardrailsHasTripwire(results) {
    return (results ?? []).some((r) => r?.tripwireTriggered === true);
}

function getGuardrailSafeText(results, fallbackText) {
    // Prefer checked_text as the generic safe/processed text
    for (const r of results ?? []) {
        if (r?.info && ("checked_text" in r.info)) {
            return r.info.checked_text ?? fallbackText;
        }
    }
    // Fall back to PII-specific anonymized_text if present
    const pii = (results ?? []).find((r) => r?.info && "anonymized_text" in r.info);
    return pii?.info?.anonymized_text ?? fallbackText;
}

function buildGuardrailFailOutput(results) {
    const get = (name) => (results ?? []).find((r) => {
          const info = r?.info ?? {};
          const n = (info?.guardrail_name ?? info?.guardrailName);
          return n === name;
        }),
          pii = get("Contains PII"),
          mod = get("Moderation"),
          jb = get("Jailbreak"),
          hal = get("Hallucination Detection"),
          piiCounts = Object.entries(pii?.info?.detected_entities ?? {})
              .filter(([, v]) => Array.isArray(v))
              .map(([k, v]) => k + ":" + v.length),
          thr = jb?.info?.threshold,
          conf = jb?.info?.confidence;

    return {
        pii: {
            failed: (piiCounts.length > 0) || pii?.tripwireTriggered === true,
            ...(piiCounts.length ? { detected_counts: piiCounts } : {}),
            ...(pii?.executionFailed && pii?.info?.error ? { error: pii.info.error } : {}),
        },
        moderation: {
            failed: mod?.tripwireTriggered === true || ((mod?.info?.flagged_categories ?? []).length > 0),
            ...(mod?.info?.flagged_categories ? { flagged_categories: mod.info.flagged_categories } : {}),
            ...(mod?.executionFailed && mod?.info?.error ? { error: mod.info.error } : {}),
        },
        jailbreak: {
            // Rely on runtime-provided tripwire; don't recompute thresholds
            failed: jb?.tripwireTriggered === true,
            ...(jb?.executionFailed && jb?.info?.error ? { error: jb.info.error } : {}),
        },
        hallucination: {
            // Rely on runtime-provided tripwire; don't recompute
            failed: hal?.tripwireTriggered === true,
            ...(hal?.info?.reasoning ? { reasoning: hal.info.reasoning } : {}),
            ...(hal?.info?.hallucination_type ? { hallucination_type: hal.info.hallucination_type } : {}),
            ...(hal?.info?.hallucinated_statements ? { hallucinated_statements: hal.info.hallucinated_statements } : {}),
            ...(hal?.info?.verified_statements ? { verified_statements: hal.info.verified_statements } : {}),
            ...(hal?.executionFailed && hal?.info?.error ? { error: hal.info.error } : {}),
        },
    };
}
const ClassificationAgentSchema = z.object({ classification: z.enum(["return_item", "cancel_subscription", "get_information"]) });
const classificationAgent = new Agent({
  name: "Classification agent",
  instructions: `Classify the user’s intent into one of the following categories: "instruction", "payment", or "get_information". 

1. Any device-related return requests should route to return_item.
2. Any retention or cancellation risk, including any request for discounts should route to cancel_subscription.
3. Any other requests should go to get_information.`,
  model: "gpt-4.1-nano",
  outputType: ClassificationAgentSchema,
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

const instruction = new Agent({
  name: "Instruction",
  instructions: `Explain how to use NextRows. 

NextRows is an AI-native spreadsheet where users can paste links, images, or text, and the system automatically converts that information into a clean, structured table.
On the next step, users can:
Edit or update data directly in the table,
Fill missing data using AI and web search, and
Schedule recurring updates (cron jobs) to keep data fresh automatically.`,
  model: "gpt-4.1-mini",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

const payment = new Agent({
  name: "payment",
  instructions: "For the payment related inquiry, primary goal is to understand user's intend. do not give any unconfirmed answer to users, rather ask for their email address, and the person agent would revisit and get back to the email address. ",
  model: "gpt-4.1-mini",
  tools: [
    getRetentionOffers
  ],
  modelSettings: {
    temperature: 1,
    topP: 1,
    parallelToolCalls: true,
    maxTokens: 2048,
    store: true
  }
});

const informationAgent = new Agent({
  name: "Information agent",
  instructions: `You are an information agent for answering informational queries. Your aim is to provide clear, concise responses to user questions. Use the policy below to assemble your answer.

⚙️ How It Works
Input: User pastes a link (e.g., product page, job listing, dataset), image, or text snippet.
Extraction: AI parses and structures the content into a table.
Refinement: Users can clean, reorganize, or enrich data columns with AI prompts.
Automation: Users can schedule periodic updates (daily, weekly, etc.) so data stays up to date without manual work.
Integration: Connects with Google Sheets, Airtable, Notion, or CSV export to fit existing workflows.
🧠 Use Cases
Researchers gathering data from multiple sources
Marketing teams tracking competitors or leads
Operations teams managing vendor lists or inventory
Interns or analysts automating repetitive copy-paste work
🚀 Vision
NextRows aims to make structured data collection and maintenance effortless — a Figma-like experience for spreadsheets, combining:
The collaboration and speed of modern web apps,
The intelligence of AI data parsing and enrichment, and
The automation of scheduled jobs and integrations.`,
  model: "gpt-4.1-mini",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

type WorkflowInput = { input_as_text: string };


// Main code entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("NewBlog", async () => {
    const state = {

    };
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: workflow.input_as_text
          }
        ]
      }
    ];
    const runner = new Runner({
      traceMetadata: {
        "__trace_source__": "agent-builder",
        workflow_id: "wf_68e593354f44819090106f074db195460d72c636d29c7493"
      }
    });
    const guardrailsInputtext = workflow.input_as_text;
    const guardrailsResult = await runGuardrails(guardrailsInputtext, jailbreakGuardrailConfig, context, true);
    const guardrailsHastripwire = guardrailsHasTripwire(guardrailsResult);
    const guardrailsAnonymizedtext = getGuardrailSafeText(guardrailsResult, guardrailsInputtext);
    const guardrailsOutput = (guardrailsHastripwire ? buildGuardrailFailOutput(guardrailsResult ?? []) : { safe_text: (guardrailsAnonymizedtext ?? guardrailsInputtext) });
    if (guardrailsHastripwire) {
      return guardrailsOutput;
    } else {
      const classificationAgentResultTemp = await runner.run(
        classificationAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...classificationAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!classificationAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const classificationAgentResult = {
        output_text: JSON.stringify(classificationAgentResultTemp.finalOutput),
        output_parsed: classificationAgentResultTemp.finalOutput
      };
      if (classificationAgentResult.output_parsed.classification == "instruction") {
        const instructionResultTemp = await runner.run(
          instruction,
          [
            ...conversationHistory
          ]
        );
        conversationHistory.push(...instructionResultTemp.newItems.map((item) => item.rawItem));

        if (!instructionResultTemp.finalOutput) {
            throw new Error("Agent result is undefined");
        }

        const instructionResult = {
          output_text: instructionResultTemp.finalOutput ?? ""
        };
      } else if (classificationAgentResult.output_parsed.classification == "payment") {
        const paymentResultTemp = await runner.run(
          payment,
          [
            ...conversationHistory
          ]
        );
        conversationHistory.push(...paymentResultTemp.newItems.map((item) => item.rawItem));

        if (!paymentResultTemp.finalOutput) {
            throw new Error("Agent result is undefined");
        }

        const paymentResult = {
          output_text: paymentResultTemp.finalOutput ?? ""
        };
      } else if (classificationAgentResult.output_parsed.classification == "get_information") {
        const informationAgentResultTemp = await runner.run(
          informationAgent,
          [
            ...conversationHistory
          ]
        );
        conversationHistory.push(...informationAgentResultTemp.newItems.map((item) => item.rawItem));

        if (!informationAgentResultTemp.finalOutput) {
            throw new Error("Agent result is undefined");
        }

        const informationAgentResult = {
          output_text: informationAgentResultTemp.finalOutput ?? ""
        };
      } else {
        return classificationAgentResult;
      }
    }
  });
}
