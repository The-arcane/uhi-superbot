
// triage-symptoms.ts
'use server';
/**
 * @fileOverview A symptom triage AI agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TriageSymptomsInput as TriageSymptomsInputType } from '@/types/entities';
import { getDoctorRecommendationsTool } from './recommend-doctors'; 

const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const TriageSymptomsInputSchema = z.object({
  symptoms: z.string().describe('The symptoms described by the user or their current query.'),
  language: z.string().optional().describe('The language for the AI to respond in (e.g., "en", "es", "hi"). Defaults to English if not provided.'),
  chatHistory: z.array(ChatHistoryMessageSchema).optional().describe('The recent history of the conversation for context.'),
});
export type TriageSymptomsInput = z.infer<typeof TriageSymptomsInputSchema>;

const DoctorPageRecommendationSchema = z.object({
  introText: z.string().describe("Textual advice about which kind of doctor to see, or an intro for listing all doctors. Example: 'For these symptoms, you might consider consulting a Neurologist.' or 'Okay, here's a list of all doctors on our panel.'"),
  buttonText: z.string().describe("Text for the button linking to the doctors page (e.g., 'View Recommended Neurologists', 'View All Doctors on Page')."),
  linkQuery: z.string().optional().describe("Query parameters for the doctors page link (e.g., 'specialization=Neurology'). Empty if linking to all doctors without pre-filter."),
});

const TriageSymptomsOutputSchema = z.object({
  potentialCauses: z.string().describe("A conversational explanation of potential causes or a friendly message for non-health queries/developer info."),
  homeRemedies: z.string().describe("Friendly, CONVERSATIONAL PARAGRAPH of home remedy suggestions, including HOW-TO for exercises/yoga/Ayurveda. Empty if not applicable."),
  shouldSeeDoctor: z.boolean().describe("True for severe/urgent symptoms only."),
  isDeveloperInfoResponse: z.boolean().optional().describe('True if the response is about developer info.'),
  isListingAllDoctorsResponse: z.boolean().optional().describe('True if the user asked to list all doctors.'),
  doctorPageRecommendation: DoctorPageRecommendationSchema.nullable().optional(),
});
export type TriageSymptomsOutput = z.infer<typeof TriageSymptomsOutputSchema>;

export async function triageSymptoms(input: TriageSymptomsInputType): Promise<TriageSymptomsOutput> {
  return triageSymptomsFlow(input);
}

const triageSymptomsPrompt = ai.definePrompt({
  name: 'triageSymptomsPrompt',
  tools: [getDoctorRecommendationsTool], // Tool is available but not explicitly forced for direct output formatting in chat
  input: {schema: TriageSymptomsInputSchema},
  output: {schema: TriageSymptomsOutputSchema},
  prompt: `You are an AI Health Assistant. Your primary function is to assist with health-related queries.
Respond in a friendly, conversational, and empathetic tone.
Your responses for 'potentialCauses' and 'homeRemedies' should be conversational and easy to understand.

{{#if language}}
  Respond in {{language}}. If {{language}} is 'hi' (Hindi) and the user's query is Hinglish, try to respond in Hinglish.
{{else}}
  Respond in English.
{{/if}}

Consider the following recent conversation history for context:
{{#if chatHistory}}
{{#each chatHistory}}
- {{role}}: {{{content}}}
{{/each}}
{{/if}}

User's current input: {{{symptoms}}}

If the user asks who developed you, who made you, or similar phrases (e.g., "aapko kisne banaya hai"):
- Set 'potentialCauses': "I was thoughtfully designed and developed by Raunaq Adlakha, a skilled software engineer! My main purpose is to assist with your health questions." (Frame this in the requested language/Hinglish if applicable).
- Set 'homeRemedies': ""
- Set 'shouldSeeDoctor': false
- Set 'isDeveloperInfoResponse': true
- Set 'isListingAllDoctorsResponse': false
- Set 'doctorPageRecommendation': null

Else if the user asks to "list all doctors", "show all doctors", "tell me all doctors", "all doctors on ur panel?", "give me all doctors list", or similar phrases:
- Set 'potentialCauses': "Okay, I can help with that. Here's information about the doctors on our panel:"
- Set 'homeRemedies': ""
- Set 'shouldSeeDoctor': false
- Set 'isDeveloperInfoResponse': false
- Set 'isListingAllDoctorsResponse': true
- For 'doctorPageRecommendation':
    - Set 'introText': "You can find all empaneled doctors on our dedicated page."
    - Set 'buttonText': "View All Doctors on Page"
    - Set 'linkQuery': ""

Else if the user's input is clearly not health-related (e.g., 'why is the sky blue', 'hello', 'how are you'):
- Set 'potentialCauses': "I am a health assistant and can only help with health-related questions. For general knowledge questions, please use a search engine."
- Set 'homeRemedies': ""
- Set 'shouldSeeDoctor': false
- Set 'isDeveloperInfoResponse': false
- Set 'isListingAllDoctorsResponse': false
- Set 'doctorPageRecommendation': null

Else (user describes symptoms or asks a health-related question, including requests for specific types of doctors like "suggest a cardiologist"):
- Set 'potentialCauses': Provide a conversational explanation of potential issues based on input and chat history.
- For 'homeRemedies':
    Your response for this field should be a CONVERSATIONAL PARAGRAPH that flows naturally after the 'potentialCauses' explanation.
    Provide friendly, safe home remedy suggestions (NO MEDICINE).
    If appropriate and safe for the symptoms, suggest gentle exercises, relevant yoga poses or breathing techniques (e.g., 'deep diaphragmatic breathing for stress'), or simple, commonly known Ayurvedic practices (like gargling with turmeric water for a sore throat, or specific dietary suggestions like ginger tea for mild nausea if applicable and not constituting medical advice).
    CRITICALLY: Include simple instructions on HOW TO PERFORM these. For example, instead of just 'do leg exercises', describe a specific exercise: 'You could try some gentle leg exercises such as calf raises. To do this, stand tall, then slowly lift your heels off the floor, hold for a moment, and then slowly lower them back down. Repeating this 10-15 times can be a good start.'
    Similarly for yoga: 'A simple yoga pose like Child\'s Pose might help you relax. You can do this by kneeling on the floor, then sitting back on your heels, and gently folding your upper body forward to rest your forehead on the mat, with your arms extended in front of you or resting by your sides.'
    Ensure suggestions are general, safe, and avoid suggesting specific herbal medicines. Maintain a conversational tone. If no such remedies are applicable or safe, leave this field as an empty string.
- Set 'shouldSeeDoctor': Set to true ONLY for genuinely URGENT/SEVERE symptoms (e.g., chest pain, difficulty breathing, severe bleeding, stroke signs, sudden loss of vision, suicidal thoughts). For common symptoms like a simple headache (without other red flags), cough, or mild fever, set this to false.
- Set 'isDeveloperInfoResponse': false
- Set 'isListingAllDoctorsResponse': false
- For 'doctorPageRecommendation':
    1.  Determine relevant specialization(s) based on the user's query (symptoms or direct request like "suggest a cardiologist"). For "General Practitioner" or "Medicine Doctor", use "General Medicine" as the specialization for the link.
    2.  Set 'introText': A conversational lead-in, e.g., "For these symptoms, you might consider consulting a [Determined Specialization]." or "Okay, for [Requested Specialization], you can view specialists on our doctors page."
    3.  Set 'buttonText': Based on the specialization, e.g., "View Recommended [Determined Specialization]s" or "View Doctors on Page".
    4.  Set 'linkQuery': If a specialization is determined (e.g., Cardiology, Neurology, General Medicine), set this to "specialization=[DeterminedSpecialization]". Otherwise, "".
    CRITICAL: Do NOT attempt to list specific doctor names in the \`introText\`. Guide the user to the /doctors page with the correct filter.
  `,
});

const triageSymptomsFlow = ai.defineFlow(
  {
    name: 'triageSymptomsFlow',
    inputSchema: TriageSymptomsInputSchema,
    outputSchema: TriageSymptomsOutputSchema,
  },
  async (input: TriageSymptomsInputType): Promise<TriageSymptomsOutput> => {
    const {output} = await triageSymptomsPrompt(input);

    if (!output) {
        console.error("[triageSymptomsFlow] Critical error: LLM output was undefined.");
        // Return a default error structure that matches the schema
        return {
            potentialCauses: "I'm sorry, I encountered an issue processing your request. Please try again.",
            homeRemedies: "",
            shouldSeeDoctor: false,
            isDeveloperInfoResponse: false,
            isListingAllDoctorsResponse: false,
            doctorPageRecommendation: null // Explicitly null
        };
    }

    // Ensure doctorPageRecommendation is null if it's a dev info or generic non-health response
    if (output.isDeveloperInfoResponse || (output.potentialCauses && output.potentialCauses.startsWith("I am a health assistant"))) {
        output.doctorPageRecommendation = null;
    }

    // Map "General Practitioner" or "Medicine Doctor" from LLM's inferred specialization to "General Medicine" for linkQuery
    if (output.doctorPageRecommendation && output.doctorPageRecommendation.linkQuery) {
        const specializationInLink = output.doctorPageRecommendation.linkQuery.split('=')[1];
        if (specializationInLink) {
            const lowerSpecialization = decodeURIComponent(specializationInLink).toLowerCase();
            if (lowerSpecialization.includes("general practitioner") || lowerSpecialization.includes("medicine doctor") || lowerSpecialization.includes("general practice")) {
                output.doctorPageRecommendation.linkQuery = "specialization=General%20Medicine";
            }
        }
    }
    
    // Final safety net for doctorPageRecommendation fields if the object exists but LLM messed up
    if (output.doctorPageRecommendation) {
        output.doctorPageRecommendation.introText = output.doctorPageRecommendation.introText || "Please see our doctors page for more options.";
        output.doctorPageRecommendation.buttonText = output.doctorPageRecommendation.buttonText || "View Doctors on Page";
        // linkQuery can be undefined/empty string
    }


    return output;
  }
);

export type { TriageSymptomsInputType as TriageSymptomsInput, TriageSymptomsOutput };

    