
// src/components/chatbot/AnalyzeDocumentDialog.tsx
'use client';

import type { FC, ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyzeDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysisType: 'prescription' | 'lab_report';
  onAnalyze: (input: { documentText?: string; documentDataUri?: string }) => Promise<void>;
  isLoading: boolean;
}

const AnalyzeDocumentDialog: FC<AnalyzeDocumentDialogProps> = ({ isOpen, onClose, analysisType, onAnalyze, isLoading }) => {
  const [documentText, setDocumentText] = useState('');
  const [documentDataUri, setDocumentDataUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB. For PDFs, AI processing may be limited.",
          variant: "destructive",
        });
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Unsupported File Type",
          description: "Please select an image file (JPG, PNG) or a PDF. DOCX analysis is not yet supported. Best results with images.",
          variant: "destructive",
        });
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentDataUri(reader.result as string);
        setSelectedFileName(file.name);
        setDocumentText(''); // Clear text input if file is selected
      };
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Could not read the selected file. Please try again.",
          variant: "destructive",
        });
        setDocumentDataUri(null);
        setSelectedFileName(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedFile = () => {
    setDocumentDataUri(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!documentDataUri && documentText.trim() === '') {
        toast({
            title: "No Content",
            description: `Please paste text or upload an image/PDF of your ${analysisType.replace('_', ' ')}.`,
            variant: "destructive",
        });
        return;
    }
    onAnalyze({
      documentText: documentDataUri ? undefined : documentText,
      documentDataUri: documentDataUri ?? undefined
    });
  };

  const title = analysisType === 'prescription' ? 'Analyze Prescription' : 'Analyze Lab Report';
  const placeholder = analysisType === 'prescription'
    ? 'Paste the full text of your prescription here, or upload an image/PDF below...'
    : 'Paste the full text of your lab report here, or upload an image/PDF below...';

  const canSubmit = !isLoading && (!!documentDataUri || documentText.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      if (!isLoading) {
        clearSelectedFile();
        setDocumentText('');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription asChild className="pt-2">
            <div>
              Paste the text content or upload an image (JPG, PNG) or PDF of your {analysisType.replace('_', ' ')}. The AI will provide a summary.
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>Important:</strong> This analysis is for informational purposes only and not medical advice. Max file size: 5MB.
                <br />Best results are typically achieved with clear images or pasted text. PDF processing capabilities by the AI may vary. DOCX analysis is not yet available.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="document-text-area">Paste Text (Optional if uploading file)</Label>
            <Textarea
              id="document-text-area"
              value={documentText}
              onChange={(e) => {
                setDocumentText(e.target.value);
                if (e.target.value.trim() !== '' && documentDataUri) {
                    clearSelectedFile(); // Clear file if user starts typing
                }
              }}
              placeholder={placeholder}
              rows={8}
              className="resize-y min-h-[120px] bg-input"
              disabled={isLoading || !!documentDataUri} // Disable if file is uploaded or loading
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">OR</div>
          <div>
            <Label htmlFor="document-file-upload">Upload Image (JPG, PNG) or PDF</Label>
            <Input
              id="document-file-upload"
              type="file"
              accept="image/jpeg, image/png, application/pdf" 
              onChange={handleFileChange}
              className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isLoading}
              ref={fileInputRef}
            />
            {selectedFileName && (
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <span className="truncate">
                  <UploadCloud className="inline h-4 w-4 mr-2 text-green-500" />
                  Selected: {selectedFileName}
                </span>
                <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={isLoading} className="h-6 w-6">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Clear file</span>
                </Button>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              For PDF uploads, AI analysis capabilities might be limited. Images (JPG, PNG) or pasted text generally provide better results.
            </p>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => {
            clearSelectedFile();
            setDocumentText('');
            onClose();
          }} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyzeDocumentDialog;
