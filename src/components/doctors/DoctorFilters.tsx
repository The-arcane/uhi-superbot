
'use client';

import React from 'react';
import type { FC } from 'react';
import { useForm, Controller }
from 'react-hook-form';
import type { DoctorFilters as DoctorFiltersType } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getUniqueSpecializations, getUniqueCities } from '@/lib/doctorData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter, X } from 'lucide-react';

interface DoctorFiltersProps {
  onFilterChange: (filters: DoctorFiltersType) => void;
  onClearFilters: () => void;
  initialFilters: DoctorFiltersType; // Changed from optional to required
}

const DoctorFilters: FC<DoctorFiltersProps> = ({ onFilterChange, onClearFilters, initialFilters }) => {
  const specializations = getUniqueSpecializations();
  const cities = getUniqueCities();

  const defaultFormValues: DoctorFiltersType = {
    specialization: '',
    city: '',
    minRating: 0,
  };

  // defaultValues for useForm will be the initialFilters passed from the parent,
  // which are derived from the URL.
  const { control, handleSubmit, watch, reset } = useForm<DoctorFiltersType>({
    defaultValues: initialFilters, // Directly use initialFilters from props
  });

  const onSubmit = (data: DoctorFiltersType) => {
    const filtersToApply: DoctorFiltersType = {};
    if (data.specialization) {
      filtersToApply.specialization = data.specialization;
    }
    if (data.city) {
      filtersToApply.city = data.city;
    }
    
    const rating = data.minRating ? parseFloat(String(data.minRating)) : 0;
    if (!isNaN(rating) && rating >= 0) {
        filtersToApply.minRating = rating;
    }
    onFilterChange(filtersToApply);
  };
  
  const handleClear = () => {
    reset(defaultFormValues); // Reset form to visual defaults
    onClearFilters(); // This will update the URL, leading to re-keying
  };

  // Watch for changes and submit automatically
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Only submit if it's a change event (user interaction)
      // This prevents submitting when the form is reset due to key/prop changes
      if (type === 'change') { 
        handleSubmit(onSubmit)();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, handleSubmit, onSubmit]);

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><ListFilter className="mr-2 h-5 w-5" /> Filter Doctors</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Controller
              name="specialization"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === 'all' ? '' : value)} 
                  value={field.value || ''}
                >
                  <SelectTrigger id="specialization">
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === 'all' ? '' : value)} 
                  value={field.value || ''}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="minRating">Min. Rating (0-5)</Label>
            <Controller
              name="minRating"
              control={control}
              render={({ field }) => (
                <Input
                  id="minRating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Any (0)"
                  {...field}
                  value={field.value || 0} 
                  onChange={(e) => {
                    const valStr = e.target.value;
                    const value = valStr === '' ? 0 : parseFloat(valStr);
                    field.onChange(isNaN(value) ? 0 : Math.max(0, Math.min(5, value)));
                  }}
                />
              )}
            />
          </div>
           <div className="lg:col-start-3 flex justify-end mt-4 sm:mt-0">
             <Button type="button" variant="ghost" onClick={handleClear} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DoctorFilters;
