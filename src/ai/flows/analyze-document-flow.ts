
// src/ai/flows/analyze-document-flow.ts
'use server';
/**
 * @fileOverview An AI agent for analyzing medical documents like prescriptions or lab reports from text or image.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalyzeDocumentInput as AnalyzeDocumentInputType, AnalyzeDocumentOutput as AnalyzeDocumentOutputType } from '@/types/entities';


const AnalyzeDocumentInputSchema = z.object({
  documentDataUri: z.string().optional().describe(
    "An image of the medical document (prescription or lab report) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Use this if an image is uploaded."
  ),
  documentText: z.string().optional().describe(
    'The text content of the medical document. Use this if text is pasted directly and no image is uploaded.'
  ),
  documentType: z.enum(['prescription', 'lab_report']).describe("The type of document being analyzed: 'prescription' or 'lab_report'."),
  language: z.string().optional().describe('The language for the AI to respond in (e.g., "en", "es", "hi"). Defaults to English if not provided. If a language like Hindi is selected, try to understand and respond to mixed language like Hinglish if encountered.'),
}).refine(data => data.documentDataUri || data.documentText, {
  message: "Either documentDataUri or documentText must be provided.",
  path: ["documentDataUri", "documentText"], 
});


const AnalyzeDocumentOutputSchema = z.object({
  summary: z.string().describe('A summary of the key information extracted from the document. This should be factual and avoid interpretation or medical advice.'),
  disclaimer: z.string().describe('A standard disclaimer stating that the analysis is not medical advice and a healthcare professional should be consulted.'),
});


export async function analyzeDocument(input: AnalyzeDocumentInputType): Promise<AnalyzeDocumentOutputType> {
  return analyzeDocumentFlow(input);
}

const analyzeDocumentPrompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an AI assistant. Your task is to analyze the provided medical document content.
{{#if language}}Respond in {{language}}. If the specified language is one where mixed-language (e.g., Hinglish if language is 'hi') is common, attempt to understand and respond appropriately to such mixed input.{{else}}Respond in English.{{/if}}

Document Type: {{documentType}}

{{#if documentDataUri}}
Document Content (from uploaded image):
{{media url=documentDataUri}}
{{else if documentText}}
Document Content (from pasted text):
{{{documentText}}}
{{else}}
No document content was provided. Please either upload an image or paste the text of your document.
{{/if}}

Instructions:
1. Carefully review the document content.
2. If the documentType is 'prescription':
   - Identify medication names, dosages, frequencies, and any other relevant instructions.
   - Summarize this information clearly.
3. If the documentType is 'lab_report':
   - Identify test names, their values, units, and reference ranges if provided.
   - Highlight any values that appear outside of typical reference ranges (if available).
   - Summarize this information.
4. Your summary should be objective and stick to the information present in the document. Do NOT provide any medical interpretation, diagnosis, advice, or treatment recommendations.
5. CRITICAL: You MUST ALWAYS provide the following disclaimer as the value for the 'disclaimer' field: "This analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or interpreted from this analysis."

Provide the output in the specified JSON schema.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE', 
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input: AnalyzeDocumentInputType) => {
    if (!input.documentDataUri && !input.documentText) {
      return {
        summary: "No document content was provided. Please upload an image or paste text.",
        disclaimer: "This analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or interpreted from this analysis."
      };
    }
    const {output} = await analyzeDocumentPrompt(input);
    return {
      summary: output?.summary || "Could not analyze the document. Please try again.",
      disclaimer: "This analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or interpreted from this analysis."
    };
  }
);

export type { AnalyzeDocumentInputType as AnalyzeDocumentInput, AnalyzeDocumentOutputType as AnalyzeDocumentOutput };
