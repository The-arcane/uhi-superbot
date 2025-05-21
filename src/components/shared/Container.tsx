import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

const Container: FC<ContainerProps> = ({ children, className }) => {
  return (
    <div className={cn("container mx-auto px-4 py-6", className)}>
      {children}
    </div>
  );
};

export default Container;
