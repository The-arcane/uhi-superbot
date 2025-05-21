import type { FC } from 'react';
import { Star, StarHalf, StarOff } from 'lucide-react'; // StarOff can be used for empty star

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  starSize?: number;
  className?: string;
}

const StarRating: FC<StarRatingProps> = ({ rating, maxRating = 5, starSize = 4, className }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={`flex items-center text-yellow-400 ${className}`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" className={`w-${starSize} h-${starSize}`} />
      ))}
      {halfStar && <StarHalf key="half" fill="currentColor" className={`w-${starSize} h-${starSize}`} />}
      {[...Array(emptyStars)].map((_, i) => (
         <Star key={`empty-${i}`} className={`w-${starSize} h-${starSize} text-gray-300`} />
      ))}
       <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)} / {maxRating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
