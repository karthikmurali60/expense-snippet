import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  // Add local state to handle the popover open state
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Handle date selection safely
  const handleSelect = (selectedRange: DateRange | undefined) => {
    onDateRangeChange(selectedRange);
    // Don't close the popover immediately when selecting the first date
    if (selectedRange?.to) {
      setIsOpen(false);
    }
  };
  
  // Format the display date safely
  const formatDisplayDate = () => {
    try {
      if (dateRange?.from) {
        if (dateRange.to) {
          return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`;
        }
        return format(dateRange.from, "LLL dd, y");
      }
      return "Select date range";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Select date range";
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formatDisplayDate()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
