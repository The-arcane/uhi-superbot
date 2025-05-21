
'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, TriageResultData, DocumentAnalysisData, AnalyzeDocumentInput, ChatHistoryMessage } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageCard from './ChatMessageCard';
import { triageSymptoms } from '@/ai/flows/triage-symptoms';
import { analyzeDocument } from '@/ai/flows/analyze-document-flow';
import { Bot, Send, AlertTriangle, FileText, Mic, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AnalyzeDocumentDialog from './AnalyzeDocumentDialog';
import VoiceInputDialog from './VoiceInputDialog';
import { cn } from '@/lib/utils';

interface ChatbotUIProps {
  onEmergencyRequired: (symptoms: string) => void;
}

const MAX_CHAT_HISTORY_FOR_AI = 6; // Number of recent messages to send to AI

const ChatbotUI: FC<ChatbotUIProps> = ({ onEmergencyRequired }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', sender: 'ai', text: "Hello! I'm MediBot. How can I help you with your health concerns today? You can also ask me to analyze a prescription or lab report by pasting text or uploading an image.", timestamp: new Date() }
  ]);
  const [typedInput, setTypedInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<'prescription' | 'lab_report' | null>(null);

  const [isVoiceInputDialogOpen, setIsVoiceInputDialogOpen] = useState(false);
  const [voiceDialogUserTranscript, setVoiceDialogUserTranscript] = useState<string | null>(null);
  const [voiceDialogAiResponse, setVoiceDialogAiResponse] = useState<ChatMessage | null>(null);
  const [isWaitingForAiInDialog, setIsWaitingForAiInDialog] = useState(false);
  const [isAiSpeakingInDialog, setIsAiSpeakingInDialog] = useState(false);

  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [wasLastInputVoice, setWasLastInputVoice] = useState(false);
  const [clientLanguage, setClientLanguage] = useState<string>('en-US'); // Default, will be updated

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientLanguage(navigator.language || 'en-US');
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      const utt = new SpeechSynthesisUtterance();

      utt.onstart = () => setIsAiSpeakingInDialog(true);
      utt.onend = () => setIsAiSpeakingInDialog(false);
      utt.onerror = () => setIsAiSpeakingInDialog(false);
      setUtterance(utt);

      const loadVoices = () => {
        const availableVoices = synth.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          // Try to set a default voice once loaded
          if (utt && !utt.voice) {
            const effectiveLang = clientLanguage;
            const targetLang = effectiveLang.split('-')[0];
            let selectedVoice = availableVoices.find(v => v.lang === effectiveLang && v.default) ||
                                availableVoices.find(v => v.lang === effectiveLang) ||
                                availableVoices.find(v => v.lang.startsWith(targetLang + '-') && v.default) ||
                                availableVoices.find(v => v.lang.startsWith(targetLang + '-')) ||
                                availableVoices.find(v => v.lang.startsWith('en') && v.default) ||
                                availableVoices.find(v => v.default) ||
                                (availableVoices.length > 0 ? availableVoices[0] : null);
            if (selectedVoice) utt.voice = selectedVoice;
          }
        }
      };

      loadVoices();
      if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
      
      return () => {
        if (synth.speaking) synth.cancel();
        setIsAiSpeakingInDialog(false);
        if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = null;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLanguage]); // Re-run if clientLanguage changes, to potentially re-select voice

  const speakText = useCallback((text: string, lang?: string) => {
    if (!speechSynthesis || !utterance || !text.trim() || !isSpeakingEnabled) {
      setIsAiSpeakingInDialog(false);
      return;
    }

    if (speechSynthesis.speaking) speechSynthesis.cancel();

    utterance.text = text;
    const effectiveLang = lang || clientLanguage;
    utterance.lang = effectiveLang;

    if (!utterance.voice || utterance.voice.lang !== effectiveLang) {
        const targetLang = effectiveLang.split('-')[0];
        let selectedVoice = voices.find(v => v.lang === effectiveLang && v.default) ||
                            voices.find(v => v.lang === effectiveLang) ||
                            voices.find(v => v.lang.startsWith(targetLang + '-') && v.default) ||
                            voices.find(v => v.lang.startsWith(targetLang + '-')) ||
                            voices.find(v => v.lang.startsWith('en') && v.default) ||
                            voices.find(v => v.default) ||
                            (voices.length > 0 ? voices[0] : null);
        if (selectedVoice) utterance.voice = selectedVoice;
    }
    speechSynthesis.speak(utterance);
  }, [speechSynthesis, utterance, voices, isSpeakingEnabled, clientLanguage]);

  const processAndSpeakAiMessage = (message: ChatMessage, lang?: string, speakThisMessage?: boolean) => {
    if (!isSpeakingEnabled || !speakThisMessage) {
      setIsAiSpeakingInDialog(false);
      return;
    }

    let textToSpeak = "";
    if (typeof message.text === 'string') {
      textToSpeak += message.text;
    }
    
    if (message.triageResult) {
      const { potentialCauses, homeRemedies, suggestedDoctors, isDeveloperInfoResponse } = message.triageResult;
      const nonHealthQueryText = "I am a health assistant and can only help with health-related questions. For general knowledge questions, please use a search engine.";
      
      if (isDeveloperInfoResponse && potentialCauses) {
        if(!message.text) textToSpeak += potentialCauses;
      } else if (potentialCauses === nonHealthQueryText) {
         if(!message.text) textToSpeak += potentialCauses;
      } else {
        if (potentialCauses && !message.text) textToSpeak += `Potential issues: ${potentialCauses} `;
        else if (potentialCauses && message.text) textToSpeak += ` Potential issues: ${potentialCauses} `;

        if (homeRemedies) {
          textToSpeak += `For home remedies: ${homeRemedies} `;
        }
        if (suggestedDoctors) {
          textToSpeak += `${suggestedDoctors} `;
        }
      }
    }
    
    if (message.analysisResult && message.analysisResult.summary) {
       textToSpeak += ` Here's a summary of the document: ${message.analysisResult.summary}. Please remember, ${message.analysisResult.disclaimer}`;
    }

    if(textToSpeak.trim()){
      speakText(textToSpeak, lang);
    } else {
      setIsAiSpeakingInDialog(false);
    }
  };

  const formatMessageForHistory = (message: ChatMessage): string => {
    if (message.sender === 'system' || message.isLoading) return ""; // Should not happen if filtered

    if (typeof message.text === 'string' && message.text.trim() !== '') {
      return message.text;
    }
    if (message.triageResult) {
      let content = "";
      if (message.triageResult.isDeveloperInfoResponse && message.triageResult.potentialCauses) {
        content = message.triageResult.potentialCauses;
      } else if (message.triageResult.potentialCauses === "I am a health assistant and can only help with health-related questions. For general knowledge questions, please use a search engine.") {
        content = message.triageResult.potentialCauses;
      } else {
        if(message.triageResult.potentialCauses) content += `Potential causes: ${message.triageResult.potentialCauses}. `;
        if(message.triageResult.homeRemedies) content += `Home remedies: ${message.triageResult.homeRemedies}. `;
        if(message.triageResult.suggestedDoctors) content += `Doctor suggestion: ${message.triageResult.suggestedDoctors}.`;
      }
      return content.trim();
    }
    if (message.analysisResult) {
      return `Analyzed ${message.analysisResult.analysisType}: ${message.analysisResult.summary}. Disclaimer: ${message.analysisResult.disclaimer}`.trim();
    }
    return ""; // Fallback for unexpected cases
  };


  const executeSendMessageLogic = async (messageContent: string, isInputFromVoice: boolean) => {
    if (messageContent.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    if (isInputFromVoice) {
      setVoiceDialogUserTranscript(messageContent);
      setVoiceDialogAiResponse(null); // Clear previous AI response in dialog
      setIsWaitingForAiInDialog(true);
    } else {
      setTypedInput(''); // Clear typed input only if it wasn't voice
    }
    
    setIsLoading(true);
    setWasLastInputVoice(isInputFromVoice);

    const langToUse = clientLanguage; 
    
    const loadingMessageId = `ai-loading-${Date.now()}`;
    // Add a temporary loading message to the main chat log
    setMessages(prev => [...prev, { id: loadingMessageId, sender: 'ai', text: '', isLoading: true, timestamp: new Date() }]);

    // Prepare chat history
    const recentMessages = messages
      .filter(msg => (msg.sender === 'user' || msg.sender === 'ai') && !msg.isLoading)
      .slice(-MAX_CHAT_HISTORY_FOR_AI);

    const chatHistoryForAI: ChatHistoryMessage[] = recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: formatMessageForHistory(msg)
    })).filter(item => item.content.trim() !== "");


    try {
      const aiResponseData = await triageSymptoms({ 
        symptoms: messageContent, 
        language: langToUse.split('-')[0],
        chatHistory: chatHistoryForAI,
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId)); // Remove loading message

      let aiMessageText = "";
      let triageResultForMessage: TriageResultData | null = null;

      const nonHealthQueryText = "I am a health assistant and can only help with health-related questions. For general knowledge questions, please use a search engine.";

      if (aiResponseData.isDeveloperInfoResponse || aiResponseData.potentialCauses === nonHealthQueryText) {
        aiMessageText = aiResponseData.potentialCauses || ""; // Main text is directly the info
        triageResultForMessage = { 
            potentialCauses: aiResponseData.potentialCauses, // Keep for ChatMessageCard logic
            homeRemedies: "", 
            shouldSeeDoctor: false,
            suggestedDoctors: "",
            isDeveloperInfoResponse: aiResponseData.isDeveloperInfoResponse,
        };
      } else {
        // For actual health queries, message.text can be empty if all info is in triageResult
        aiMessageText = ""; 
        triageResultForMessage = aiResponseData;
      }
      
      const aiResponseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiMessageText,
        triageResult: triageResultForMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseMessage]);

      if (isInputFromVoice) {
        setVoiceDialogAiResponse(aiResponseMessage); // Update dialog with AI response
        setIsWaitingForAiInDialog(false);
      }
      processAndSpeakAiMessage(aiResponseMessage, langToUse, isInputFromVoice); // Speak only if input was voice

      if (aiResponseData.shouldSeeDoctor) {
        const systemMessageText = `Your symptoms may require medical attention. Consider contacting emergency services if it's critical.`;
        const systemMessage: ChatMessage = {
          id: `system-emergency-${Date.now()}`,
          sender: 'system',
          text: (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{systemMessageText}</span>
            </div>
          ),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
        onEmergencyRequired(messageContent);
      }

    } catch (error) {
      console.error("Error calling AI for triage:", error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId)); // Remove loading message
      const errorText = "I'm sorry, I encountered an error. Please try again.";
      const errorMessage: ChatMessage = { id: `ai-error-${Date.now()}`, sender: 'ai', text: errorText, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);

      if (isInputFromVoice) {
        setVoiceDialogAiResponse(errorMessage);
        setIsWaitingForAiInDialog(false);
      }
      // Speak error only if previous input was voice
      if (isSpeakingEnabled && isInputFromVoice) speakText(errorText, langToUse);
      setIsAiSpeakingInDialog(false); // Ensure this is reset on error
      toast({ title: "AI Error", description: "Could not get response.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      // wasLastInputVoice is managed per send, don't reset globally here unless typed input
      if (!isInputFromVoice) {
         setWasLastInputVoice(false);
      }
    }
  };
  
  const handleTypedSendMessage = () => {
    if (typedInput.trim() === '') return;
    setWasLastInputVoice(false); // Explicitly mark as not voice
    executeSendMessageLogic(typedInput, false);
  };

  // This is called from VoiceInputDialog
  const handleVoiceTranscriptSubmit = (transcript: string) => {
    if (transcript.trim() === '') {
      toast({title: "No speech detected to send.", variant: "default"});
      setIsWaitingForAiInDialog(false); // If voice dialog was waiting but no transcript came
      return;
    }
    // Don't set typedInput here
    executeSendMessageLogic(transcript, true); // true indicates input is from voice
  };

  const handleOpenAnalysisDialog = (type: 'prescription' | 'lab_report') => {
    setAnalysisType(type);
    setIsAnalysisDialogOpen(true);
  };

  const handleAnalyzeDocument = async (analysisInput: { documentText?: string; documentDataUri?: string }) => {
    if (!analysisType || (!analysisInput.documentText && !analysisInput.documentDataUri)) return;

    const currentInputWasFromVoice = wasLastInputVoice; // Capture current state for this specific analysis
    setIsLoading(true); 
    
    if (isVoiceInputDialogOpen) { // If voice dialog is open, show analysis loading there too
        setVoiceDialogUserTranscript(`Analyzing ${analysisType.replace('_',' ')}...`);
        setVoiceDialogAiResponse(null);
        setIsWaitingForAiInDialog(true);
    }

    const loadingMessageId = `ai-loading-analysis-${Date.now()}`;
    const analysisActionText = analysisInput.documentDataUri ? 'uploaded file' : 'pasted text';
    const langToUse = clientLanguage; 

    setMessages(prev => [...prev, {
      id: loadingMessageId,
      sender: 'ai',
      text: `Analyzing ${analysisType.replace('_', ' ')} from ${analysisActionText}...`,
      isLoading: true,
      timestamp: new Date()
    }]);

    try {
      const inputPayload: AnalyzeDocumentInput = {
        ...analysisInput,
        documentType: analysisType!,
        language: langToUse.split('-')[0]
      };
      const analysisResponseData = await analyzeDocument(inputPayload);

      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      const analysisResult: DocumentAnalysisData = {
        analysisType: analysisType!,
        summary: analysisResponseData.summary,
        disclaimer: analysisResponseData.disclaimer,
      };

      const aiAnalysisMessageText = `Here is the analysis of your ${analysisType!.replace('_', ' ')}:`;
      const aiAnalysisMessage: ChatMessage = {
        id: `ai-analysis-${Date.now()}`,
        sender: 'ai',
        text: aiAnalysisMessageText,
        analysisResult: analysisResult,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiAnalysisMessage]);
      
      if (isVoiceInputDialogOpen) { // If voice dialog was open for this
          setVoiceDialogAiResponse(aiAnalysisMessage);
          setIsWaitingForAiInDialog(false);
      }
      processAndSpeakAiMessage(aiAnalysisMessage, langToUse, currentInputWasFromVoice); // Speak only if the interaction *leading to analysis* was voice

    } catch (error) {
      console.error(`Error calling AI for ${analysisType} analysis:`, error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      const errorText = `Sorry, error analyzing ${analysisType!.replace('_', ' ')}.`;
      const errorMessage: ChatMessage = { id: `ai-error-analysis-${Date.now()}`, sender: 'ai', text: errorText, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);

      if (isVoiceInputDialogOpen) {
        setVoiceDialogAiResponse(errorMessage);
        setIsWaitingForAiInDialog(false);
      }
      if (isSpeakingEnabled && currentInputWasFromVoice) speakText(errorText, langToUse);
      setIsAiSpeakingInDialog(false); // Ensure reset
      toast({ title: "AI Analysis Error", variant: "destructive" });
    } finally {
      setIsLoading(false); 
      setIsAnalysisDialogOpen(false); 
      setAnalysisType(null);
      // Do not reset wasLastInputVoice here, as analysis can be triggered from typed or voice context
    }
  };

  const handleVoiceDialogClose = () => {
    setIsVoiceInputDialogOpen(false);
    setVoiceDialogUserTranscript(null);
    setVoiceDialogAiResponse(null);
    setIsWaitingForAiInDialog(false);
    if (speechSynthesis?.speaking) {
      speechSynthesis.cancel();
    }
    setIsAiSpeakingInDialog(false); // Explicitly reset
  }

  const toggleSpeakingEnabled = () => {
    const newSpeakingEnabledState = !isSpeakingEnabled;
    setIsSpeakingEnabled(newSpeakingEnabledState);
    if (!newSpeakingEnabledState && speechSynthesis?.speaking) {
      speechSynthesis.cancel();
      setIsAiSpeakingInDialog(false);
    }
    toast({
      title: `AI Speech ${newSpeakingEnabledState ? "Enabled" : "Disabled"}`,
    });
  };


  return (
    <>
      <Card className="h-full flex flex-col shadow-xl border-primary/20">
        <CardHeader className="border-b border-border flex flex-row justify-between items-center pr-4">
          <div className="flex items-center">
            <CardTitle className="flex items-center text-xl text-primary">
              <Bot className="mr-2 h-6 w-6" /> AI Health Assistant
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSpeakingEnabled}
            className="shrink-0"
            aria-label={isSpeakingEnabled ? "Disable AI speech" : "Enable AI speech"}
          >
            {isSpeakingEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map(msg => (
                <ChatMessageCard key={msg.id} message={msg} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t border-border flex flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            <Textarea
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder="Describe your symptoms or ask to analyze a document..."
              rows={1}
              className="flex-grow resize-none min-h-[40px] max-h-[120px] bg-background focus-visible:ring-accent"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTypedSendMessage();
                }
              }}
              disabled={isLoading}
            />
             <Button
                onClick={() => {
                  // wasLastInputVoice will be set true when transcript is submitted from dialog
                  setIsVoiceInputDialogOpen(true);
                }}
                variant="outline"
                size="icon"
                disabled={isLoading}
                className="shrink-0 bg-secondary hover:bg-secondary/80"
                aria-label="Start voice input"
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button onClick={handleTypedSendMessage} disabled={isLoading || typedInput.trim() === ''} className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <div className="flex w-full items-center gap-2 justify-start">
            <Button variant="outline" size="sm" onClick={() => handleOpenAnalysisDialog('prescription')} disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" /> Analyze Prescription
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenAnalysisDialog('lab_report')} disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" /> Analyze Lab Report
            </Button>
          </div>
        </CardFooter>
      </Card>
      {analysisType && (
        <AnalyzeDocumentDialog
          isOpen={isAnalysisDialogOpen}
          onClose={() => {
            setIsAnalysisDialogOpen(false);
            setAnalysisType(null);
          }}
          analysisType={analysisType}
          onAnalyze={handleAnalyzeDocument}
          isLoading={isLoading}
        />
      )}
      <VoiceInputDialog
        isOpen={isVoiceInputDialogOpen}
        onClose={handleVoiceDialogClose}
        onTranscriptSubmit={handleVoiceTranscriptSubmit} // This now directly calls executeSendMessageLogic
        currentLanguage={clientLanguage}
        userTranscriptForDialog={voiceDialogUserTranscript}
        aiResponseForDialog={voiceDialogAiResponse}
        isWaitingForAiInDialog={isWaitingForAiInDialog}
        isAiSpeakingInDialog={isAiSpeakingInDialog} // Used for animation inside dialog
      />
    </>
  );
};

export default ChatbotUI;
