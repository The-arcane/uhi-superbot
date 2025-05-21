
import type { LucideIcon } from 'lucide-react';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  city: string;
  rating: number;
  availability: string;
  image: string; 
  contact?: string;
  icon?: LucideIcon; 
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string | React.ReactNode;
  timestamp: Date;
  isLoading?: boolean;
  triageResult?: TriageResultData | null;
  analysisResult?: DocumentAnalysisData | null; 
}

export interface TriageResultData {
  potentialCauses?: string;
  homeRemedies?: string;
  shouldSeeDoctor?: boolean;
  isDeveloperInfoResponse?: boolean;
  isListingAllDoctorsResponse?: boolean; 

  doctorPageRecommendation?: {
    introText: string; 
    buttonText: string; 
    linkQuery?: string; // e.g., "specialization=Neurology" or ""
  };
}

export interface DocumentAnalysisData {
  analysisType: 'prescription' | 'lab_report';
  summary: string;
  disclaimer: string;
}

export interface DoctorFilters {
  specialization?: string;
  city?: string;
  minRating?: number;
}

export interface AnalyzeDocumentInput {
  documentDataUri?: string; 
  documentText?: string;    
  documentType: 'prescription' | 'lab_report';
  language?: string;        
}

export interface AnalyzeDocumentOutput {
  summary: string;
  disclaimer: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface TriageSymptomsInput {
  symptoms: string;
  language?: string;
  chatHistory?: ChatHistoryMessage[];
}

// This can be simplified or removed if the tool's output is directly consumed as Doctor[]
export interface DoctorRecommendation {
    name: string;
    specialization: string;
    hospital: string;
    city: string;
    rating: number;
    availability: string;
    contact?: string;
}
