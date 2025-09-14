import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

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
  
  // State for text input values
  const [fromDateText, setFromDateText] = React.useState<string>("");
  const [toDateText, setToDateText] = React.useState<string>("");
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Check if device is mobile
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);
  
  // Update text inputs when dateRange changes
  React.useEffect(() => {
    if (dateRange?.from) {
      setFromDateText(format(dateRange.from, "MM/dd/yyyy"));
    }
    if (dateRange?.to) {
      setToDateText(format(dateRange.to, "MM/dd/yyyy"));
    }
  }, [dateRange?.from, dateRange?.to]);
  
  // Handle date selection from calendar
  const handleSelect = (selectedRange: DateRange | undefined) => {
    onDateRangeChange(selectedRange);
    // Don't close the popover immediately when selecting the first date
    if (selectedRange?.to) {
      setIsOpen(false);
    }
  };
  
  // Handle date input from text fields
  const handleDateTextChange = (type: "from" | "to", value: string) => {
    setInputError(null);
    if (type === "from") {
      setFromDateText(value);
    } else {
      setToDateText(value);
    }
  };
  
  // Parse and validate date text input
  const handleDateTextBlur = (type: "from" | "to") => {
    try {
      if (type === "from" && fromDateText) {
        const parsedDate = parse(fromDateText, "MM/dd/yyyy", new Date());
        if (!isValid(parsedDate)) {
          setInputError("Invalid date format. Use MM/DD/YYYY");
          return;
        }
        
        onDateRangeChange({ 
          from: parsedDate, 
          to: dateRange?.to 
        });
      } else if (type === "to" && toDateText) {
        const parsedDate = parse(toDateText, "MM/dd/yyyy", new Date());
        if (!isValid(parsedDate)) {
          setInputError("Invalid date format. Use MM/DD/YYYY");
          return;
        }
        
        if (!dateRange?.from) {
          setInputError("Please select a start date first");
          return;
        }
        
        if (parsedDate < dateRange.from) {
          setInputError("End date must be after start date");
          return;
        }
        
        onDateRangeChange({ 
          from: dateRange.from, 
          to: parsedDate 
        });
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      setInputError("Invalid date format. Use MM/DD/YYYY");
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
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            {/* Text input fields for dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-date">Start Date</Label>
                <Input
                  id="from-date"
                  placeholder="MM/DD/YYYY"
                  value={fromDateText}
                  onChange={(e) => handleDateTextChange("from", e.target.value)}
                  onBlur={() => handleDateTextBlur("from")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">End Date</Label>
                <Input
                  id="to-date"
                  placeholder="MM/DD/YYYY"
                  value={toDateText}
                  onChange={(e) => handleDateTextChange("to", e.target.value)}
                  onBlur={() => handleDateTextBlur("to")}
                />
              </div>
            </div>
            
            {/* Error message */}
            {inputError && (
              <div className="text-sm text-red-500">{inputError}</div>
            )}
            
            {/* Calendar picker */}
            <div className="border-t pt-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleSelect}
                numberOfMonths={isMobile ? 1 : 2}
                className="rounded-md border"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
