'use client';

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import type { Doctor, DoctorFilters as DoctorFiltersType } from '@/types/entities';
import DoctorCard from './DoctorCard';
import DoctorFilters from './DoctorFilters';
import { AlertCircle, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '../ui/button';

interface DoctorListDisplayProps {
  allDoctors: Doctor[];
}

const DoctorListDisplay: FC<DoctorListDisplayProps> = ({ allDoctors }) => {
  const [filters, setFilters] = useState<DoctorFiltersType>({});
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const handleFilterChange = (newFilters: DoctorFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter(doctor => {
      if (filters.specialization && doctor.specialization !== filters.specialization) return false;
      if (filters.city && doctor.city !== filters.city) return false;
      if (filters.minRating && doctor.rating < filters.minRating) return false;
      return true;
    });
  }, [allDoctors, filters]);

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctorForBooking(doctor);
  };

  return (
    <div className="space-y-6">
      <DoctorFilters 
        onFilterChange={handleFilterChange} 
        onClearFilters={handleClearFilters}
        initialFilters={filters}
      />
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} onBookAppointment={handleBookAppointment} />
          ))}
        </div>
      ) : (
        <Alert variant="default" className="bg-card">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Doctors Found</AlertTitle>
          <AlertDescription>
            No doctors match your current filter criteria. Try adjusting your filters or view all doctors.
          </AlertDescription>
        </Alert>
      )}

      {selectedDoctorForBooking && (
        <Dialog open={!!selectedDoctorForBooking} onOpenChange={() => setSelectedDoctorForBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-primary" /> Book Appointment with {selectedDoctorForBooking.name}
              </DialogTitle>
              <DialogDescription className="pt-2">
                To book an appointment with {selectedDoctorForBooking.name} ({selectedDoctorForBooking.specialization} at {selectedDoctorForBooking.hospital}, {selectedDoctorForBooking.city}), please use the contact information below or visit their website.
                <p className="mt-4 font-semibold">Contact: {selectedDoctorForBooking.contact || "Please contact the hospital directly."}</p>
                <p className="mt-2 text-sm">Note: This is a demo. In a real application, this might link to a booking system or provide more direct contact options.</p>
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4 flex justify-end">
                <Button onClick={() => setSelectedDoctorForBooking(null)} variant="outline">Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DoctorListDisplay;
