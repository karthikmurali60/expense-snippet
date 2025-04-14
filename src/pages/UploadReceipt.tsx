import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchSplitwiseGroups, createSplitwiseExpense, SplitwiseGroup } from '@/integrations/splitwise/client';
import { format } from 'date-fns';

interface ReceiptItem {
  item_name: string;
  price: number;
}

const UploadReceipt = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [splitwiseGroups, setSplitwiseGroups] = useState<SplitwiseGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [editingPrices, setEditingPrices] = useState<Record<number, number>>({});
  const [isAddingToSplitwise, setIsAddingToSplitwise] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadSplitwiseGroups = async () => {
      try {
        const groups = await fetchSplitwiseGroups();
        setSplitwiseGroups(groups);
        console.log('Splitwise groups:', groups);
        if (groups.length > 0) {
          setSelectedGroupId(groups[0].id);
          console.log('Default group set:', groups[0].id);
        }
      } catch (error) {
        console.error('Error loading Splitwise groups:', error);
        toast.error('Failed to load Splitwise groups. Please make sure you are logged in and have set up your Splitwise API key in settings.');
      }
    };

    loadSplitwiseGroups();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SPLITWISE_WRAPPER_URL}/get_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const data = await response.json();
      const parsedItems = JSON.parse(data.response);
      setItems(parsedItems);
      
      // Initialize editing prices with the original prices
      const initialEditingPrices: Record<number, number> = {};
      parsedItems.forEach((item: ReceiptItem, index: number) => {
        initialEditingPrices[index] = item.price;
      });
      setEditingPrices(initialEditingPrices);
      
      toast.success('Receipt processed successfully');
    } catch (error) {
      toast.error('Failed to process receipt. Please try again.');
      console.error('Error processing receipt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditingPrices(prev => ({
        ...prev,
        [index]: numValue
      }));
    }
  };

  const handleAddToSplitwise = async (index: number) => {
    console.log('Adding item to Splitwise:', items[index], selectedGroupId);
    if (selectedGroupId == null) {
      toast.error('Please select a Splitwise group first');
      return;
    }

    setIsAddingToSplitwise(prev => ({ ...prev, [index]: true }));
    
    try {
      const item = items[index];
      const price = editingPrices[index];
      
      // Format current date as YYYY-MM-DD
      const formattedDate = format(new Date(), 'yyyy-MM-dd');
      
      // Create Splitwise expense
      await createSplitwiseExpense({
        cost: price.toString(),
        description: item.item_name,
        date: formattedDate,
        group_id: selectedGroupId,
      });
      
      toast.success(`Added "${item.item_name}" to Splitwise`);
    } catch (error) {
      console.error('Error adding item to Splitwise:', error);
      toast.error('Failed to add item to Splitwise');
    } finally {
      setIsAddingToSplitwise(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <Layout>
      <div className="p-4 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
          <p className="text-muted-foreground mt-1">Extract items from your receipt automatically</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          <Card className="h-fit w-full">
            <CardHeader>
              <CardTitle>Upload Receipt</CardTitle>
              <CardDescription>
                Upload a photo of your receipt to automatically extract items and prices
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <div className="space-y-4 w-full">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="cursor-pointer flex flex-col items-center w-full"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                  </label>
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Selected receipt"
                      className="mt-4 max-h-48 object-contain w-full"
                    />
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedImage || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Process Receipt'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card className="h-fit w-full">
              <CardHeader>
                <CardTitle>Extracted Items</CardTitle>
                <CardDescription>
                  Review and add items to your Splitwise group
                </CardDescription>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="text-lg font-semibold">Total Bill Amount</span>
                  <span className="text-2lg font-bold text-primary">
                    ${Object.values(editingPrices).reduce((sum, price) => sum + price, 0).toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="w-full">
                <div className="space-y-4 w-full">
                  <div className="w-full">
                    <label className="text-sm font-medium mb-2 block">Splitwise Group</label>
                    <Select
                      value={selectedGroupId?.toString() || ''}
                      onValueChange={(value) => setSelectedGroupId(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {splitwiseGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 w-full">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-accent/10 rounded-lg w-full"
                      >
                        <span className="flex-1">{item.item_name}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingPrices[index] || 0}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                          <Button
                            onClick={() => handleAddToSplitwise(index)}
                            disabled={isAddingToSplitwise[index]}
                            size="sm"
                          >
                            {isAddingToSplitwise[index] ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UploadReceipt; 