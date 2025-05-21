
import type { FC } from 'react';
import Image from 'next/image';
import type { Doctor } from '@/types/entities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { MapPin, Briefcase, CheckCircle, ExternalLink } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: (doctor: Doctor) => void; 
}

const DoctorCard: FC<DoctorCardProps> = ({ doctor, onBookAppointment }) => {
  const IconComponent = doctor.icon || Briefcase;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card border border-border">
      <CardHeader className="p-4">
        <div className="flex items-start gap-4">
          <Image
            src={doctor.image}
            alt={`Photo of ${doctor.name}`}
            width={80}
            height={80}
            className="rounded-full border-2 border-primary object-cover"
            data-ai-hint="doctor medical professional"
          />
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-card-foreground">{doctor.name}</CardTitle>
            <div className="flex items-center text-sm text-primary mt-1">
              <IconComponent className="w-4 h-4 mr-1.5" data-ai-hint={`${doctor.specialization} icon`} />
              {doctor.specialization}
            </div>
            <StarRating rating={doctor.rating} className="mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2 shrink-0" />
            <span>{doctor.hospital}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 shrink-0" />
            <span>{doctor.city}</span>
          </div>
          {doctor.availability && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{doctor.availability}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-accent hover:bg-accent/80 text-accent-foreground" 
          onClick={() => onBookAppointment(doctor)}
          aria-label={`Book appointment with ${doctor.name}`}
        >
          Book Appointment <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
