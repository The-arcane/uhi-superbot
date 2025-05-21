
import type { Doctor } from '@/types/entities';
import { Heart, Baby, Brain, Eye, Smile, Activity, ShieldAlert, Stethoscope, UserRound, Bone, Ear, Users, Waves, Syringe, Pill } from 'lucide-react'; // Added Bone, Ear, Users (for General/Family), Waves (Urology placeholder), Syringe/Pill
import type { LucideIcon } from 'lucide-react';

// Updated list of 26 doctors
const doctorsList: Omit<Doctor, 'id' | 'image' | 'icon'>[] = [
    {"name": "Dr. Aisha Patel", "specialization": "Cardiology", "hospital": "City Hospital", "city": "Mumbai", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact City Hospital for Dr. Aisha Patel."},
    {"name": "Dr. Michael Chang", "specialization": "Cardiology", "hospital": "Heart Institute", "city": "Mumbai", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Heart Institute for Dr. Michael Chang."},
    {"name": "Dr. William Parker", "specialization": "Cardiology", "hospital": "Heart & Vascular Institute", "city": "Delhi", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Heart & Vascular Institute for Dr. William Parker."},
    {"name": "Dr. Rajesh Kumar", "specialization": "Orthopedics", "hospital": "Central Medical Center", "city": "Delhi", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact Central Medical Center for Dr. Rajesh Kumar."},
    {"name": "Dr. Neha Verma", "specialization": "Orthopedics", "hospital": "Ortho Life Hospital", "city": "Ahmedabad", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Ortho Life Hospital for Dr. Neha Verma."},
    {"name": "Dr. Priya Singh", "specialization": "Pediatrics", "hospital": "Children's Hospital", "city": "Bangalore", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Children's Hospital for Dr. Priya Singh."},
    {"name": "Dr. Emma Thompson", "specialization": "Pediatrics", "hospital": "Kids Care Hospital", "city": "Delhi", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Kids Care Hospital for Dr. Emma Thompson."},
    {"name": "Dr. Sarah Johnson", "specialization": "Dermatology", "hospital": "Skin Care Clinic", "city": "Mumbai", "rating": 4.6, "availability": "Available for appointments", "contact": "Contact Skin Care Clinic for Dr. Sarah Johnson."},
    {"name": "Dr. Kavita Mehra", "specialization": "Dermatology", "hospital": "Glow Derma Center", "city": "Chandigarh", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Glow Derma Center for Dr. Kavita Mehra."},
    {"name": "Dr. Ahmed Khan", "specialization": "Neurology", "hospital": "Brain & Spine Center", "city": "Delhi", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact Brain & Spine Center for Dr. Ahmed Khan."},
    {"name": "Dr. Anil Deshmukh", "specialization": "Neurology", "hospital": "Neuro Care Hospital", "city": "Nagpur", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Neuro Care Hospital for Dr. Anil Deshmukh."},
    {"name": "Dr. Lisa Chen", "specialization": "Ophthalmology", "hospital": "Vision Care Center", "city": "Chennai", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Vision Care Center for Dr. Lisa Chen."},
    {"name": "Dr. Rakesh Nair", "specialization": "Ophthalmology", "hospital": "Eye World Hospital", "city": "Kochi", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Eye World Hospital for Dr. Rakesh Nair."},
    {"name": "Dr. James Wilson", "specialization": "Psychiatry", "hospital": "Mental Health Institute", "city": "Hyderabad", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Mental Health Institute for Dr. James Wilson."},
    {"name": "Dr. Meera Iyer", "specialization": "Psychiatry", "hospital": "Mind Wellness Center", "city": "Chennai", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Mind Wellness Center for Dr. Meera Iyer."},
    {"name": "Dr. Maria Rodriguez", "specialization": "Endocrinology", "hospital": "Diabetes Care Center", "city": "Pune", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact Diabetes Care Center for Dr. Maria Rodriguez."},
    {"name": "Dr. Sunita Malhotra", "specialization": "Endocrinology", "hospital": "Endocrine Health Clinic", "city": "Lucknow", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Endocrine Health Clinic for Dr. Sunita Malhotra."},
    {"name": "Dr. Olivia Martinez", "specialization": "Oncology", "hospital": "Cancer Care Center", "city": "Mumbai", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact Cancer Care Center for Dr. Olivia Martinez."},
    {"name": "Dr. Nikhil Mehra", "specialization": "Oncology", "hospital": "OncoLife Hospital", "city": "Delhi", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact OncoLife Hospital for Dr. Nikhil Mehra."},
    {"name": "Dr. Ananya Sharma", "specialization": "General Medicine", "hospital": "City Health Clinic", "city": "Jaipur", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact City Health Clinic for Dr. Ananya Sharma."},
    {"name": "Dr. Rohit Sinha", "specialization": "General Medicine", "hospital": "Metro General Hospital", "city": "Patna", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Metro General Hospital for Dr. Rohit Sinha."},
    {"name": "Dr. Ritu Sharma", "specialization": "Gynecology", "hospital": "Women's Wellness Center", "city": "Mumbai", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact Women's Wellness Center for Dr. Ritu Sharma."},
    {"name": "Dr. Alisha Kapoor", "specialization": "Gynecology", "hospital": "Motherhood Hospital", "city": "Delhi", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact Motherhood Hospital for Dr. Alisha Kapoor."},
    {"name": "Dr. Pooja Iyer", "specialization": "ENT", "hospital": "ENT & Voice Clinic", "city": "Pune", "rating": 4.8, "availability": "Available for appointments", "contact": "Contact ENT & Voice Clinic for Dr. Pooja Iyer."},
    {"name": "Dr. Karan Singh", "specialization": "ENT", "hospital": "Hearing & ENT Care", "city": "Chandigarh", "rating": 4.7, "availability": "Available for appointments", "contact": "Contact Hearing & ENT Care for Dr. Karan Singh."},
    {"name": "Dr. Manish Arora", "specialization": "Urology", "hospital": "UroLife Hospital", "city": "Bhopal", "rating": 4.9, "availability": "Available for appointments", "contact": "Contact UroLife Hospital for Dr. Manish Arora."}
];

export const getSpecialtyIcon = (specialization: string): LucideIcon => {
  const lowerSpec = specialization.toLowerCase();
  if (lowerSpec.includes('cardiology')) return Heart;
  if (lowerSpec.includes('orthopedics')) return Bone; // Changed from Activity
  if (lowerSpec.includes('pediatrics')) return Baby;
  if (lowerSpec.includes('dermatology')) return UserRound;
  if (lowerSpec.includes('neurology')) return Brain;
  if (lowerSpec.includes('ophthalmology')) return Eye;
  if (lowerSpec.includes('psychiatry')) return Smile;
  if (lowerSpec.includes('endocrinology')) return Activity; // Activity can represent endocrine system, metabolism
  if (lowerSpec.includes('oncology')) return ShieldAlert; // Or Syringe/Pill if preferred
  if (lowerSpec.includes('general medicine')) return Users; // Users can represent general/family practice
  if (lowerSpec.includes('gynecology')) return Baby; // Or a more abstract icon like Stethoscope if Baby is too specific
  if (lowerSpec.includes('ent')) return Ear;
  if (lowerSpec.includes('urology')) return Waves; // Placeholder for urology, can be Stethoscope
  if (lowerSpec.includes('general practice')) return Stethoscope; // Explicitly
  return Stethoscope; // Default for any other specialization
};

export const doctors: Doctor[] = doctorsList.map((doc, index) => ({
  ...doc,
  id: `doc-${index + 1}-${doc.name.toLowerCase().replace(/\s+/g, '-')}`,
  image: `https://placehold.co/100x100.png`, // You can replace this with actual image URLs if available
  icon: getSpecialtyIcon(doc.specialization),
}));

export const getUniqueSpecializations = (): string[] => {
  const specializations = doctors.map(doc => doc.specialization);
  return Array.from(new Set(specializations)).sort();
};

export const getUniqueCities = (): string[] => {
  const cities = doctors.map(doc => doc.city);
  return Array.from(new Set(cities)).sort();
};
