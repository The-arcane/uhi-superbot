
import type { FC } from 'react';
import type { ChatMessage } from '@/types/entities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, AlertTriangle, Info, Zap, Brain, FileText, ShieldCheck, ExternalLink, Pill, Leaf, Bike } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface ChatMessageCardProps {
  message: ChatMessage;
}

const ChatMessageCard: FC<ChatMessageCardProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';
  const isSystem = message.sender === 'system';

  const avatarIcon = isUser ? <User className="h-5 w-5" /> : isAI ? <Bot className="h-5 w-5" /> : <Info className="h-5 w-5" />;
  const avatarFallback = isUser ? 'U' : isAI ? 'AI' : 'S';

  if (message.isLoading) {
    return (
      <div className={cn("flex items-start gap-3 w-full my-3", !isUser ? "justify-start" : "justify-end")}>
        {!isUser && (
          <Avatar className="h-8 w-8 border border-border shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground">{avatarFallback}</AvatarFallback>
          </Avatar>
        )}
        <Card className={cn(
          "max-w-[75%] shadow-sm",
          !isUser ? "bg-muted rounded-lg rounded-tl-none" : "bg-primary text-primary-foreground rounded-lg rounded-tr-none"
        )}>
          <CardContent className="p-3">
            <Skeleton className="h-5 w-24" />
          </CardContent>
        </Card>
        {isUser && (
          <Avatar className="h-8 w-8 border border-border shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">{avatarFallback}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  let isPlainInformationalAIMessage = false;
  let mainInformationalText = "";

  if (isAI && message.triageResult) {
    if (message.triageResult.isDeveloperInfoResponse && message.triageResult.potentialCauses) {
      isPlainInformationalAIMessage = true;
      mainInformationalText = message.triageResult.potentialCauses;
    } else if (message.triageResult.potentialCauses && message.triageResult.potentialCauses.startsWith("I am a health assistant and can only help with health-related questions.")) {
      isPlainInformationalAIMessage = true;
      mainInformationalText = message.triageResult.potentialCauses;
    }
  }
  
  if (isAI && typeof message.text === 'string' &&
      (message.text.startsWith("I was thoughtfully designed and developed by Raunaq Adlakha") ||
       message.text.startsWith("I am a health assistant and can only help with health-related questions."))){
    isPlainInformationalAIMessage = true;
    mainInformationalText = message.text;
  }


  return (
    <div className={cn("flex items-start gap-3 w-full my-3", !isUser ? "justify-start" : "justify-end")}>
      {!isUser && (
        <Avatar className="h-8 w-8 border-2 border-primary shrink-0">
          <AvatarFallback className="bg-background text-primary">{avatarIcon}</AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-[85%] shadow-md",
        isUser ? "bg-primary text-primary-foreground rounded-lg rounded-tr-none" : "bg-card text-card-foreground rounded-lg rounded-tl-none",
        isSystem && "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300"
      )}>
        <CardContent className="p-3 text-sm leading-relaxed">
          {/* Display AI's direct text response OR main informational text if applicable */}
          {(typeof message.text === 'string' && message.text.trim() && !message.triageResult) || (isPlainInformationalAIMessage && mainInformationalText) ? (
            <ReactMarkdown className="prose prose-sm max-w-none">{mainInformationalText || message.text}</ReactMarkdown>
          ) : null}
          
          {/* Triage results for health queries */}
          {isAI && message.triageResult && !message.analysisResult && !isPlainInformationalAIMessage && (
            <div className={cn("space-y-3", (typeof message.text === 'string' && message.text.trim()) && "mt-2 border-t border-border pt-2")}>
              
              {message.triageResult.potentialCauses &&
               !message.triageResult.potentialCauses.startsWith("I am a health assistant and can only help with health-related questions.") &&
                (
                <div>
                  <h4 className="font-semibold text-sm text-primary flex items-center mb-1"><Brain className="w-4 h-4 mr-1.5"/>Potential Causes:</h4>
                  <ReactMarkdown className="prose prose-sm max-w-none pl-2">{message.triageResult.potentialCauses}</ReactMarkdown>
                </div>
              )}

              {message.triageResult.homeRemedies && (
                <div>
                   <h4 className="font-semibold text-sm text-accent flex items-center mb-1"><Leaf className="w-4 h-4 mr-1.5"/>Home Remedies:</h4>
                  <ReactMarkdown className="prose prose-sm max-w-none pl-2">{message.triageResult.homeRemedies}</ReactMarkdown>
                </div>
              )}

              {message.triageResult.shouldSeeDoctor && (
                <div className="p-2 bg-destructive/10 rounded-md border border-destructive/30">
                  <h4 className="font-semibold text-sm text-destructive flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5"/>Recommendation:</h4>
                  <p className="text-xs pl-2 text-destructive-foreground opacity-90">Symptoms may require urgent medical attention.</p>
                </div>
              )}
              
              {message.triageResult.doctorPageRecommendation && (
                 <div className="mt-2 pt-2 border-t border-border/50">
                  <h4 className="font-semibold text-sm flex items-center mb-1"><User className="w-4 h-4 mr-1.5 text-primary"/>Finding a Doctor:</h4>
                  {/* Ensure introText uses whitespace-pre-line for newlines from \n */}
                  <ReactMarkdown
                    className="text-xs pl-2 prose prose-sm max-w-none whitespace-pre-line"
                    components={{
                        // You can add custom renderers if needed, e.g., for lists if AI generates markdown lists
                    }}
                  >
                    {message.triageResult.doctorPageRecommendation.introText}
                  </ReactMarkdown>
                  <Button asChild variant="outline" size="sm" className="mt-2 bg-accent/10 hover:bg-accent/20 border-accent/50 text-accent hover:text-accent-foreground">
                    <Link href={`/doctors${message.triageResult.doctorPageRecommendation.linkQuery ? `?${message.triageResult.doctorPageRecommendation.linkQuery}` : ''}`}>
                      {message.triageResult.doctorPageRecommendation.buttonText}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Document Analysis Results */}
          {isAI && message.analysisResult && (
            <div className="mt-3 border-t border-border pt-3 space-y-2">
              <div>
                <h4 className="font-semibold text-sm flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-primary"/>
                  {message.analysisResult.analysisType === 'prescription' ? 'Prescription Analysis:' : 'Lab Report Analysis:'}
                </h4>
                <ReactMarkdown className="text-xs pl-2 prose prose-sm max-w-none">{message.analysisResult.summary}</ReactMarkdown>
              </div>
              <div className="p-2 bg-yellow-100/70 dark:bg-yellow-700/30 rounded-md border border-yellow-400/50 dark:border-yellow-600/50">
                  <h4 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300 flex items-center"><ShieldCheck className="w-4 h-4 mr-1.5"/>Important Disclaimer:</h4>
                  <p className="text-xs pl-2 text-yellow-700 dark:text-yellow-400">{message.analysisResult.disclaimer}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 border-2 border-primary shrink-0">
          <AvatarFallback className="bg-background text-primary">{avatarIcon}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessageCard;

