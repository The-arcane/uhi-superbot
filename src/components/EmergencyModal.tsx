import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PhoneCall } from 'lucide-react';
import { EMERGENCY_CONTACT_NUMBER } from '@/config/constants';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptoms?: string;
}

const EmergencyModal: FC<EmergencyModalProps> = ({ isOpen, onClose, symptoms }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-destructive border-destructive text-destructive-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl"> {/* text-destructive removed, will inherit */}
            <AlertTriangle className="mr-2 h-6 w-6" /> Emergency Assistance
          </DialogTitle>
          <DialogDescription asChild className="pt-2">
            <div>
              If you are experiencing a medical emergency, please seek immediate help.
              {symptoms && <div className="mt-2 text-sm">Based on your reported symptoms: <strong>"{symptoms}"</strong>, it is strongly advised to contact emergency services or visit the nearest hospital.</div>}
              <div className="mt-4">You can call emergency services directly by clicking the button below.</div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col space-y-2">
           <a href={`tel:${EMERGENCY_CONTACT_NUMBER}`} className="w-full">
            <Button className="w-full bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 text-lg py-6">
              <PhoneCall className="mr-2 h-5 w-5" /> Call Emergency ({EMERGENCY_CONTACT_NUMBER})
            </Button>
          </a>
          <p className="text-xs text-center text-destructive-foreground/80"> {/* Changed from text-muted-foreground */}
            This will attempt to dial {EMERGENCY_CONTACT_NUMBER} using your device's phone application.
          </p>
        </div>
        <DialogFooter className="mt-6">
          <Button 
            onClick={onClose}
            className="bg-transparent border border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyModal;
