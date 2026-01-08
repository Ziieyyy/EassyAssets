import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '@/services/categoriesService';

interface CategoryDropdownProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showAddButton?: boolean; // Whether to show the + Add Category button next to dropdown
}

const CategoryDropdown = ({
  value,
  onChange,
  placeholder = 'Select Category',
  className,
  disabled = false,
  required = false,
  showAddButton = false,
}: CategoryDropdownProps) => {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Get all active categories for the current user
  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getActiveCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a new category
  const createCategoryMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return categoriesService.createCategory({ name });
    },
    onSuccess: () => {
      setIsCreating(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      setIsCreating(false);
      alert(error.message || 'Failed to create category');
    },
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    setIsCreating(true);
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim()
      });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'add-new') {
      setShowAddDialog(true);
      return;
    }
    onChange(selectedValue === 'none' ? null : selectedValue);
  };

  if (isError) {
    return (
      <div className="text-destructive">
        Error loading categories. Please refresh the page.
      </div>
    );
  }

  const hasCategories = categories.length > 0;

  return (
    <div className="w-full flex items-center gap-2">
      <Select 
        value={value || 'none'} 
        onValueChange={handleSelectChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={
            hasCategories 
              ? placeholder 
              : "No categories found. Please add a category first."
          }>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : value ? (
              categories.find(cat => (cat as any).id === value)?.name || value
            ) : (
              hasCategories ? placeholder : "No categories found. Please add a category first."
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!hasCategories && (
            <SelectItem value="none" disabled>
              No categories available
            </SelectItem>
          )}
          {categories.map((category: any) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
          <SelectItem value="add-new" className="text-primary font-medium">
            <div className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add New Category
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      )}

      {/* Dialog for adding new category */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing your assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Category Name *
              </label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={isCreating || !newCategoryName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDropdown;