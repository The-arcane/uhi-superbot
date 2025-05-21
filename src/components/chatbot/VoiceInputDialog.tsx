
// src/components/chatbot/VoiceInputDialog.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, XCircle, Loader2, Bot, User, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface VoiceInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptSubmit: (transcript: string) => void;
  currentLanguage?: string; // e.g., 'en-US', 'hi-IN'
  userTranscriptForDialog: string | null;
  aiResponseForDialog: ChatMessage | null;
  isWaitingForAiInDialog: boolean;
  isAiSpeakingInDialog: boolean;
}

const VoiceInputDialog: FC<VoiceInputDialogProps> = ({ 
  isOpen, 
  onClose, 
  onTranscriptSubmit, 
  currentLanguage = 'en-US',
  userTranscriptForDialog,
  aiResponseForDialog,
  isWaitingForAiInDialog,
  isAiSpeakingInDialog
}) => {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [userTranscriptForDialog, aiResponseForDialog, isWaitingForAiInDialog, interimTranscript]);

  useEffect(() => {
    if (!isOpen) {
      stopListeningCleanup();
      setInterimTranscript('');
      setFinalTranscript('');
      setSpeechError(null);
      // Do not clear userTranscriptForDialog or aiResponseForDialog here, ChatbotUI controls them
      return;
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setSpeechError("Speech recognition is not supported in this browser.");
        return;
      }
      
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      const recognition = speechRecognitionRef.current;
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = currentLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
        // setFinalTranscript(''); // Don't clear final transcript here, it accumulates
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalAccumulator = finalTranscript; // Start with current final transcript
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalAccumulator += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        setFinalTranscript(finalAccumulator); 
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        let errorMessage = "An error occurred during speech recognition.";
        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try speaking again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone error. Check permissions.";
        else if (event.error === 'not-allowed') errorMessage = "Microphone access denied. Enable permissions.";
        
        setSpeechError(errorMessage);
        toast({ title: "Speech Error", description: errorMessage, variant: "destructive" });
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      startListening(); // Auto-start when dialog opens (if not already listening)

    } else {
      setSpeechError("Speech recognition is not supported.");
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
    }

    return stopListeningCleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentLanguage]); // Rerun if language or isOpen changes

  const stopListeningCleanup = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = () => {
    if (speechRecognitionRef.current && !isListening) {
      try {
        setInterimTranscript('');
        // setFinalTranscript(''); // Keep previous final for accumulation if desired, or clear if each "start" is new. Let's clear for new "sessions".
        setFinalTranscript('');
        setSpeechError(null);
        speechRecognitionRef.current.start();
      } catch (e) {
        const startError = "Could not start microphone. Check permissions.";
        setSpeechError(startError);
        toast({ title: "Microphone Error", description: startError, variant: "destructive" });
        setIsListening(false);
      }
    }
  };

  const handleSendTranscript = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop(); // This will trigger onend, which sets isListening to false
    }
    const transcriptToSend = finalTranscript.trim() || interimTranscript.trim();
    if (transcriptToSend) {
      onTranscriptSubmit(transcriptToSend);
      setFinalTranscript(''); // Clear after sending for the next input
      setInterimTranscript('');
    } else if (!userTranscriptForDialog) { // Only toast if nothing was ever sent for this "turn"
      toast({ title: "No Speech Detected", description: "Please say something to send.", variant: "default" });
    }
    // Dialog stays open, ChatbotUI will provide aiResponseForDialog
  };
  
  const displayedTranscript = finalTranscript + interimTranscript;

  const handleDialogClose = () => {
    stopListeningCleanup();
    onClose(); // This will also reset states in ChatbotUI for the dialog
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isListening ? <Mic className="mr-2 h-5 w-5 text-destructive animate-pulse" /> : <MicOff className="mr-2 h-5 w-5 text-muted-foreground" />}
            Voice Conversation
          </DialogTitle>
          <DialogDescription>
            {speechError ? (
              <span className="text-destructive">{speechError}</span>
            ) : isListening ? (
              "Listening... Speak now. Click Send when done."
            ) : (
              userTranscriptForDialog ? "AI is responding..." : "Click microphone or Send to submit."
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-4 border rounded-md p-3 bg-muted/30 min-h-[200px]">
          <div className="space-y-3">
            {userTranscriptForDialog && (
              <div className="flex items-start gap-2 justify-end">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg rounded-br-none max-w-[80%]">
                  <p className="text-sm">{userTranscriptForDialog}</p>
                </div>
                <User className="h-6 w-6 text-primary mt-1 shrink-0" />
              </div>
            )}

            {isWaitingForAiInDialog && !aiResponseForDialog && (
              <div className="flex items-start gap-2">
                <Bot className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div className="bg-card p-2 rounded-lg rounded-bl-none max-w-[80%]">
                   <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            {aiResponseForDialog && (
              <div className="flex items-start gap-2">
                <Bot className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div className="bg-card p-2 rounded-lg rounded-bl-none max-w-[80%]">
                    {isAiSpeakingInDialog && (
                        <div className="flex items-center text-xs text-accent mb-1">
                            <Volume2 className="h-4 w-4 mr-1 animate-pulse" />
                            AI Speaking...
                        </div>
                    )}
                    {typeof aiResponseForDialog.text === 'string' ? 
                      <ReactMarkdown className="text-sm prose prose-sm max-w-none">{aiResponseForDialog.text}</ReactMarkdown> 
                      : 
                      <div className="text-sm">{aiResponseForDialog.text}</div>
                    }
                    {/* Display triage or analysis results if present and not simple info message */}
                    {aiResponseForDialog.triageResult && !aiResponseForDialog.triageResult.isDeveloperInfoResponse && aiResponseForDialog.triageResult.potentialCauses !== "I am a health assistant and can only help with health-related questions. For general knowledge questions, please use a search engine." && (
                       <div className="mt-2 border-t pt-2 space-y-1 text-xs">
                           {aiResponseForDialog.triageResult.potentialCauses && <div><strong>Potential Causes:</strong> <ReactMarkdown className="prose prose-xs max-w-none inline">{aiResponseForDialog.triageResult.potentialCauses}</ReactMarkdown></div>}
                           {aiResponseForDialog.triageResult.homeRemedies && <div><strong>Home Remedies:</strong> <ReactMarkdown className="prose prose-xs max-w-none inline">{aiResponseForDialog.triageResult.homeRemedies}</ReactMarkdown></div>}
                           {aiResponseForDialog.triageResult.suggestedDoctors && <div><strong>Suggestion:</strong> <ReactMarkdown className="prose prose-xs max-w-none inline">{aiResponseForDialog.triageResult.suggestedDoctors}</ReactMarkdown></div>}
                       </div>
                    )}
                    {aiResponseForDialog.analysisResult && (
                        <div className="mt-2 border-t pt-2 space-y-1 text-xs">
                            <div><strong>Summary:</strong> <ReactMarkdown className="prose prose-xs max-w-none inline">{aiResponseForDialog.analysisResult.summary}</ReactMarkdown></div>
                            <div className="italic text-muted-foreground">{aiResponseForDialog.analysisResult.disclaimer}</div>
                        </div>
                    )}
                </div>
              </div>
            )}
            {/* Display current speech input below messages */}
            {isListening && displayedTranscript && (
                <div className="flex items-start gap-2 justify-end">
                     <div className="bg-primary/80 text-primary-foreground p-2 rounded-lg rounded-br-none max-w-[80%] opacity-70">
                        <p className="text-sm italic">{displayedTranscript}</p>
                    </div>
                    <User className="h-6 w-6 text-primary mt-1 shrink-0 opacity-70" />
                </div>
            )}
             <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:justify-between mt-auto pt-4 border-t">
          <Button 
            variant={isListening ? "outline" : "default"} 
            onClick={isListening ? handleSendTranscript : startListening} // Toggle start/stop if needed, but send always stops
            disabled={!!speechError && !isListening || (isWaitingForAiInDialog || isAiSpeakingInDialog) && !isListening }
            className="w-full sm:w-auto"
            size="lg"
          >
            {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {isListening ? 'Listening...' : (finalTranscript ? 'Speak Again' : 'Start Listening')}
          </Button>
          <Button 
            variant="default" 
            onClick={handleSendTranscript}
            disabled={(!finalTranscript.trim() && !interimTranscript.trim()) || isWaitingForAiInDialog || isAiSpeakingInDialog }
            className="w-full sm:w-auto bg-accent hover:bg-accent/90"
            size="lg"
          >
            <Send className="mr-2 h-5 w-5" /> Send
          </Button>
          <Button variant="outline" onClick={handleDialogClose} className="w-full sm:w-auto" size="lg">
            <XCircle className="mr-2 h-5 w-5" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceInputDialog;
