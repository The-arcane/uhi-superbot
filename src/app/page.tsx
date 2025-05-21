
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import ChatbotUI from '@/components/chatbot/ChatbotUI';
import EmergencyModal from '@/components/EmergencyModal';
// import { doctors as allDoctorsData } from '@/lib/doctorData'; // Removed
// import DoctorListDisplay from '@/components/doctors/DoctorListDisplay'; // Removed
import { APP_NAME, EMERGENCY_CONTACT_NUMBER } from '@/config/constants';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HomePage() {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencySymptoms, setEmergencySymptoms] = useState<string | undefined>(undefined);

  const handleEmergencyRequired = (symptoms: string) => {
    setEmergencySymptoms(symptoms);
    setIsEmergencyModalOpen(true);
  };

  const handleEmergencyModalClose = () => {
    setIsEmergencyModalOpen(false);
    setEmergencySymptoms(undefined);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onEmergencyClick={() => {
        setEmergencySymptoms("User initiated emergency");
        setIsEmergencyModalOpen(true);
      }} />
      <main className="flex-grow container mx-auto px-2 py-4 lg:px-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full max-h-[calc(100vh-100px)] lg:max-h-[calc(100vh-120px)]"> {/* Adjust max-h based on header height */}
          {/* Chatbot Section */}
          <div className="w-full h-full lg:max-h-full"> {/* Changed to full width */}
            <ChatbotUI onEmergencyRequired={handleEmergencyRequired} />
          </div>

          {/* Doctor Listings Section - REMOVED */}
          {/* 
          <div className="lg:w-3/5 xl:w-2/3 h-full lg:max-h-full overflow-hidden">
             <ScrollArea className="h-full pr-3">
                <DoctorListDisplay allDoctors={allDoctorsData} />
             </ScrollArea>
          </div> 
          */}
        </div>
      </main>
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={handleEmergencyModalClose}
        symptoms={emergencySymptoms}
      />
      <Toaster />
    </div>
  );
}
