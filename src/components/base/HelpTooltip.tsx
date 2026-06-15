import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';

interface HelpTooltipProps {
  content: string;
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({ content, className, iconClassName }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-muted transition-colors focus:outline-none ${className}`}
          aria-label="Informação adicional"
        >
          <HelpCircle className={`h-4 w-4 text-muted-foreground/60 hover:text-primary transition-colors ${iconClassName}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-center leading-relaxed">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
