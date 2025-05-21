
'use client';

import { Suspense } from 'react';
import type { NextPage } from 'next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react'; // Removed useState, useEffect from here as filters state is now derived
import Header from '@/components/Header';
import EmergencyModal from '@/components/EmergencyModal'; // Assuming this is still needed potentially
import { doctors as allDoctorsData } from '@/lib/doctorData';
import type { Doctor, DoctorFilters as DoctorFiltersType } from '@/types/entities';
import DoctorCard from '@/components/doctors/DoctorCard';
import DoctorFilters from '@/components/doctors/DoctorFilters';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

const DoctorPageContent: NextPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  // EmergencyModal state, if needed, would be separate. For now, focus on filters.
  // const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  // const [emergencySymptoms, setEmergencySymptoms] = useState<string | undefined>(undefined);

  // Directly derive and memoize filters from URL search parameters
  const currentFiltersFromUrl = useMemo(() => {
    const specialization = searchParams.get('specialization') || '';
    const city = searchParams.get('city') || '';
    const minRatingStr = searchParams.get('minRating');
    let ratingVal = 0;

    if (minRatingStr) {
      const parsedRating = parseFloat(minRatingStr);
      if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        ratingVal = parsedRating;
      }
    }
    return { specialization, city, minRating: ratingVal };
  }, [searchParams]);

  const handleFilterChangeFromComponent = useCallback((formFilters: DoctorFiltersType) => {
    const query = new URLSearchParams();
    if (formFilters.specialization) query.set('specialization', formFilters.specialization);
    if (formFilters.city) query.set('city', formFilters.city);
    if (formFilters.minRating && formFilters.minRating > 0) {
      query.set('minRating', formFilters.minRating.toString());
    }
    
    const queryString = query.toString();
    router.push(`/doctors${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  const handleClearFilters = useCallback(() => {
    router.push('/doctors', { scroll: false });
  }, [router]);

  const handleBookAppointmentRedirect = (doctor: Doctor) => {
    // This logic should be inside DoctorCard if it's a direct link,
    // or handled here if it needs more complex logic before redirecting.
    // For simplicity, assuming DoctorCard handles its own link for now.
    window.open('https://uhi-main.netlify.app/', '_blank');
  };

  const filteredDoctors = useMemo(() => {
    return allDoctorsData.filter(doctor => {
      if (currentFiltersFromUrl.specialization && doctor.specialization.toLowerCase() !== currentFiltersFromUrl.specialization.toLowerCase()) return false;
      if (currentFiltersFromUrl.city && doctor.city.toLowerCase() !== currentFiltersFromUrl.city.toLowerCase()) return false;
      const minRating = Number(currentFiltersFromUrl.minRating);
      if (minRating > 0 && doctor.rating < minRating) return false;
      return true;
    });
  }, [currentFiltersFromUrl]);
  
  // Emergency click handler, if needed
  // const handleEmergencyClick = () => {
  //   setEmergencySymptoms("User initiated emergency from doctors page");
  //   setIsEmergencyModalOpen(true);
  // };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onEmergencyClick={() => { /* setIsEmergencyModalOpen(true); setEmergencySymptoms(...) */ }} />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Our Doctors</h1>
          <p className="text-muted-foreground">Find and filter our panel of expert doctors.</p>
        </div>
        <DoctorFilters 
          key={JSON.stringify(currentFiltersFromUrl)} // Force re-mount when URL-derived filters change
          onFilterChange={handleFilterChangeFromComponent}
          onClearFilters={handleClearFilters}
          initialFilters={currentFiltersFromUrl} 
        />
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} onBookAppointment={handleBookAppointmentRedirect} />
            ))}
          </div>
        ) : (
          <Alert variant="default" className="bg-card mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Doctors Found</AlertTitle>
            <AlertDescription>
              No doctors match your current filter criteria. Try adjusting your filters or <Link href="/doctors" className="underline hover:text-primary" onClick={(e) => { e.preventDefault(); handleClearFilters();}}>view all doctors</Link>.
            </AlertDescription>
          </Alert>
        )}
      </main>
      {/* <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        symptoms={emergencySymptoms}
      /> */}
    </div>
  );
};

const DoctorsPageSuspenseWrapper: NextPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading doctors...</div>}>
      <DoctorPageContent />
    </Suspense>
  );
};

export default DoctorsPageSuspenseWrapper;
