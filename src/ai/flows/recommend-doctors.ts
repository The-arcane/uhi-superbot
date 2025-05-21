
// src/ai/flows/recommend-doctors.ts
'use server';
/**
 * @fileOverview This file defines a Genkit tool for recommending doctors.
 * The tool can recommend based on symptoms, a requested specialization, or list all available doctors.
 * It directly uses the static list of doctors from `lib/doctorData.ts`.
 *
 * - getDoctorRecommendationsTool - A Genkit tool that provides doctor recommendations.
 * - RecommendDoctorsInput - The input type for the tool.
 * - RecommendDoctorsOutput - The output type for the tool (array of Doctor objects).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doctors as allDoctorsFromData, type Doctor as DoctorType } from '@/lib/doctorData';

// Define the schema for a doctor, matching the structure for tool output.
const DoctorSchema = z.object({
  name: z.string().describe('The name of the doctor.'),
  specialization: z.string().describe('The specialization of the doctor.'),
  hospital: z.string().describe('The hospital where the doctor works.'),
  city: z.string().describe('The city where the doctor is located.'),
  rating: z.number().describe('The rating of the doctor (out of 5).'),
  availability: z.string().describe('The availability of the doctor for appointments.'),
  contact: z.string().optional().describe('Contact information for the doctor or hospital.'),
});
export type Doctor = z.infer<typeof DoctorSchema>;


const RecommendDoctorsInputSchema = z.object({
  symptoms: z.string().optional().describe('The symptoms described by the user. Used if no specific specialization is requested and not listing all.'),
  requestedSpecialization: z.string().optional().describe('A specific medical specialization explicitly requested by the user (e.g., "Cardiologist", "Cardiology").'),
  listAll: z.boolean().optional().default(false).describe('If true, attempts to list all available doctors, ignoring symptoms or specialization.'),
}).refine(data => data.listAll || data.symptoms || data.requestedSpecialization, {
  message: "Either listAll must be true, or symptoms or requestedSpecialization must be provided for doctor recommendations.",
  path: ["listAll", "symptoms", "requestedSpecialization"],
});
export type RecommendDoctorsInput = z.infer<typeof RecommendDoctorsInputSchema>;

const RecommendDoctorsOutputSchema = z.array(DoctorSchema).describe('A list of recommended doctors.');
export type RecommendDoctorsOutput = z.infer<typeof RecommendDoctorsOutputSchema>;

const inferSpecializationPrompt = ai.definePrompt({
  name: 'inferSpecializationFromSymptomsPrompt',
  input: { schema: z.object({ symptoms: z.string() }) },
  output: { schema: z.object({ inferredSpecializations: z.string().describe("A comma-separated list of relevant medical specializations (e.g., 'Cardiology, General Practitioner'). Prioritize common specializations. Return the field of medicine (e.g., Cardiology), not the practitioner type (e.g., Cardiologist).") }) },
  prompt: `Based on the following symptoms: "{{symptoms}}", list the most relevant medical specialization(s) (e.g., Cardiology, General Practice). If multiple, separate by comma. Be concise. For example, for "chest pain", suggest "Cardiology". For "runny nose and cough", suggest "General Practice". If symptoms are very vague like "feeling unwell", suggest "General Practice".`,
});


export const getDoctorRecommendationsTool = ai.defineTool(
  {
    name: 'getDoctorRecommendationsTool',
    description: "Fetches doctor recommendations from a predefined list. Use with 'symptoms' (string), or 'requestedSpecialization' (string - e.g. 'Cardiology' or 'Cardiologist'), or 'listAll' (boolean, to get a general list of all panel doctors). Returns a list of doctors. Prioritize using 'requestedSpecialization' if the user asks for a specific type of doctor.",
    inputSchema: RecommendDoctorsInputSchema,
    outputSchema: RecommendDoctorsOutputSchema,
  },
  async (input): Promise<Doctor[]> => {
    console.log('[getDoctorRecommendationsTool] Received input:', JSON.stringify(input));
    if (!allDoctorsFromData || !Array.isArray(allDoctorsFromData) || allDoctorsFromData.length === 0) {
      console.error('[getDoctorRecommendationsTool] Error: allDoctorsFromData is not loaded or is empty.');
      return [];
    }

    const mapToOutputSchema = (doc: DoctorType): Doctor => ({
        name: doc.name,
        specialization: doc.specialization,
        hospital: doc.hospital,
        city: doc.city,
        rating: doc.rating,
        availability: doc.availability,
        contact: doc.contact,
    });

    let filteredDoctorsData: DoctorType[] = [];

    if (input.listAll) {
      console.log('[getDoctorRecommendationsTool] Path: listAll');
      return allDoctorsFromData.map(mapToOutputSchema);
    }

    if (input.requestedSpecialization) {
      console.log('[getDoctorRecommendationsTool] Path: requestedSpecialization -', input.requestedSpecialization);
      const lowerReqSpecialization = input.requestedSpecialization.toLowerCase();
      filteredDoctorsData = allDoctorsFromData.filter(doc => {
        const docSpecializationLower = doc.specialization.toLowerCase();
        // Check if requested specialization is part of the doctor's specialization or vice-versa
        return docSpecializationLower.includes(lowerReqSpecialization) || lowerReqSpecialization.includes(docSpecializationLower);
      });
      console.log(`[getDoctorRecommendationsTool] Filtered by specialization "${input.requestedSpecialization}", found: ${filteredDoctorsData.length} doctors.`);
    } else if (input.symptoms) {
      console.log('[getDoctorRecommendationsTool] Path: symptoms -', input.symptoms);
      try {
        const { output: inferredOutput } = await inferSpecializationPrompt({ symptoms: input.symptoms });
        if (inferredOutput?.inferredSpecializations) {
          const specializations = inferredOutput.inferredSpecializations.split(',').map(s => s.trim().toLowerCase());
          console.log('[getDoctorRecommendationsTool] Inferred specializations:', specializations);
          if (specializations.length > 0) {
            filteredDoctorsData = allDoctorsFromData.filter(doc =>
              specializations.some(spec => {
                const docSpecializationLower = doc.specialization.toLowerCase();
                return docSpecializationLower.includes(spec) || spec.includes(docSpecializationLower);
              })
            );
          }
        }
      } catch (e: any) {
        console.error("[getDoctorRecommendationsTool] Error inferring specialization:", e.message, e.stack);
        // Fallback to general if inference fails or returns nothing useful
         if(filteredDoctorsData.length === 0) {
            console.log('[getDoctorRecommendationsTool] Inference failed, falling back to General Practice.');
            filteredDoctorsData = allDoctorsFromData.filter(doc =>
                doc.specialization.toLowerCase().includes("general practice") ||
                doc.specialization.toLowerCase().includes("general medicine")
            );
        }
      }
      console.log(`[getDoctorRecommendationsTool] Filtered by symptoms, found: ${filteredDoctorsData.length} doctors after inference/fallback.`);
    }

    // If no doctors found for a specific query (symptoms or requested spec), and not listAll
    if (filteredDoctorsData.length === 0 && !input.listAll && (input.symptoms || input.requestedSpecialization)) {
        if (input.symptoms && !input.requestedSpecialization) { // Symptom-based, no specific request
            console.log('[getDoctorRecommendationsTool] No doctors after symptom processing, trying General Practice as final fallback.');
            const generalDocs = allDoctorsFromData.filter(doc =>
                doc.specialization.toLowerCase().includes("general practice") ||
                doc.specialization.toLowerCase().includes("general medicine")
            );
            if (generalDocs.length > 0) return generalDocs.slice(0, 3).map(mapToOutputSchema);
        }
        console.log('[getDoctorRecommendationsTool] No doctors found for the query, returning empty list.');
        return [];
    }

    // For specific requests (not listAll), limit to 3 recommendations if more are found
    if (!input.listAll && (input.requestedSpecialization || input.symptoms) && filteredDoctorsData.length > 3) {
        console.log(`[getDoctorRecommendationsTool] More than 3 doctors found (${filteredDoctorsData.length}), slicing to 3.`);
         return filteredDoctorsData.slice(0, 3).map(mapToOutputSchema);
    }

    console.log(`[getDoctorRecommendationsTool] Returning ${filteredDoctorsData.length} doctors.`);
    return filteredDoctorsData.map(mapToOutputSchema);
  }
);

// Export a direct function for potential server-side use if needed, though tool is primary
export async function recommendDoctors(input: RecommendDoctorsInput): Promise<RecommendDoctorsOutput> {
  return getDoctorRecommendationsTool.fn(input);
}
