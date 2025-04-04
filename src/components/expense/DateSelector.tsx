
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PopoverTrigger, Popover, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DateSelectorProps {
  date: Date;
  setDate: (date: Date) => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  date, 
  setDate, 
  calendarOpen, 
  setCalendarOpen 
}) => {
  return (
    <div className="glass rounded-xl p-5">
      <label className="text-sm font-medium text-foreground mb-2 block">
        Date
      </label>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            type="button"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(date, 'PPP')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(date) => {
              if (date) {
                setDate(date);
                setCalendarOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateSelector;
