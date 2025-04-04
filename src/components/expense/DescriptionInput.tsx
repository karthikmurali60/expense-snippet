
import React from 'react';

interface DescriptionInputProps {
  description: string;
  setDescription: (description: string) => void;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({ description, setDescription }) => {
  return (
    <div className="glass rounded-xl p-5">
      <label className="text-sm font-medium text-foreground mb-2 block">
        Description
      </label>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was this expense for?"
        className="w-full rounded-lg border border-input bg-background px-3 py-2"
      />
    </div>
  );
};

export default DescriptionInput;
