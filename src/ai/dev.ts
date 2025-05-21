import { config } from 'dotenv';
config();

import '@/ai/flows/triage-symptoms.ts';
import '@/ai/flows/recommend-doctors.ts'; // Ensure this is imported so the tool is registered
import '@/ai/flows/analyze-document-flow.ts'; 
