import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Database, Filter, ArrowUpDown } from "lucide-react";

interface GuidedToolBuilderProps {
  schemaRegistry: any;
  onComplete: (wizardData: WizardData) => void;
  onCancel: () => void;
}

export interface WizardData {
  selectedTables: string[];
  filters: FilterConfig[];
  sorting: SortConfig | null;
  limit: number | null;
  includeRelated: string[];
}

interface FilterConfig {
  table: string;
  column: string;
  operator: string;
  paramName: string;
}

interface SortConfig {
  table: string;
  column: string;
  direction: 'asc' | 'desc';
}

export const GuidedToolBuilder = ({ schemaRegistry, onComplete, onCancel }: GuidedToolBuilderProps) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    selectedTables: [],
    filters: [],
    sorting: null,
    limit: 100,
    includeRelated: []
  });

  const availableTables = schemaRegistry?.tables || [];

  const handleTableToggle = (tableName: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedTables: prev.selectedTables.includes(tableName)
        ? prev.selectedTables.filter(t => t !== tableName)
        : [...prev.selectedTables, tableName]
    }));
  };

  const handleAddFilter = () => {
    if (wizardData.selectedTables.length === 0) return;
    
    setWizardData(prev => ({
      ...prev,
      filters: [...prev.filters, {
        table: prev.selectedTables[0],
        column: '',
        operator: 'eq',
        paramName: ''
      }]
    }));
  };

  const handleUpdateFilter = (index: number, updates: Partial<FilterConfig>) => {
    setWizardData(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => i === index ? { ...f, ...updates } : f)
    }));
  };

  const handleRemoveFilter = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const getTableColumns = (tableName: string) => {
    const table = availableTables.find((t: any) => t.table_name === tableName);
    return table?.available_column_names || [];
  };

  const handleComplete = () => {
    onComplete(wizardData);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === wizardStep ? 'bg-primary text-primary-foreground' :
                step < wizardStep ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {step}
              </div>
              {step < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
        <Badge variant="outline">Guided Mode</Badge>
      </div>

      {/* Step 1: Select Tables */}
      {wizardStep === 1 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Select Tables to Query
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which tables contain the data you need
            </p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {availableTables.map((table: any) => (
              <div
                key={table.table_name}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                onClick={() => handleTableToggle(table.table_name)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={wizardData.selectedTables.includes(table.table_name)}
                    onCheckedChange={() => handleTableToggle(table.table_name)}
                  />
                  <div>
                    <p className="font-medium">{table.table_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {table.record_count} records • {table.available_column_names.length} columns
                    </p>
                  </div>
                </div>
                {table.suggested_relationships?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Has relationships
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setWizardStep(2)} disabled={wizardData.selectedTables.length === 0}>
              Next: Configure Filters
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Filters */}
      {wizardStep === 2 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Configure Filters
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add filters to narrow down results (optional)
            </p>
          </div>

          <div className="space-y-3">
            {wizardData.filters.map((filter, index) => (
              <div key={index} className="p-3 rounded-lg border space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <Select value={filter.table} onValueChange={(val) => handleUpdateFilter(index, { table: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Table" />
                    </SelectTrigger>
                    <SelectContent>
                      {wizardData.selectedTables.map(table => (
                        <SelectItem key={table} value={table}>{table}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filter.column} onValueChange={(val) => handleUpdateFilter(index, { column: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTableColumns(filter.table).map((col: string) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filter.operator} onValueChange={(val) => handleUpdateFilter(index, { operator: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">Equals</SelectItem>
                      <SelectItem value="ilike">Contains</SelectItem>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="in">In list</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input 
                    placeholder="Param name"
                    value={filter.paramName}
                    onChange={(e) => handleUpdateFilter(index, { paramName: e.target.value })}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFilter(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={handleAddFilter}>
            + Add Filter
          </Button>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setWizardStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={() => setWizardStep(3)}>
              Next: Configure Output
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Configure Output */}
      {wizardStep === 3 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Configure Output
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how to sort and limit results
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Sort By</Label>
              <div className="flex gap-2 mt-1">
                <Select 
                  value={wizardData.sorting?.table || ''} 
                  onValueChange={(table) => setWizardData(prev => ({
                    ...prev,
                    sorting: { table, column: '', direction: 'desc' }
                  }))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {wizardData.selectedTables.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {wizardData.sorting?.table && (
                  <>
                    <Select 
                      value={wizardData.sorting.column} 
                      onValueChange={(column) => setWizardData(prev => ({
                        ...prev,
                        sorting: prev.sorting ? { ...prev.sorting, column } : null
                      }))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTableColumns(wizardData.sorting.table).map((col: string) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={wizardData.sorting.direction} 
                      onValueChange={(direction: 'asc' | 'desc') => setWizardData(prev => ({
                        ...prev,
                        sorting: prev.sorting ? { ...prev.sorting, direction } : null
                      }))}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label>Result Limit</Label>
              <Input
                type="number"
                value={wizardData.limit || ''}
                onChange={(e) => setWizardData(prev => ({
                  ...prev,
                  limit: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="100"
                className="w-[200px]"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setWizardStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={() => setWizardStep(4)}>
              Next: Review
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {wizardStep === 4 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Review & Generate</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Review your tool configuration before generating
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Selected Tables:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {wizardData.selectedTables.map(table => (
                  <Badge key={table} variant="secondary">{table}</Badge>
                ))}
              </div>
            </div>

            {wizardData.filters.length > 0 && (
              <div>
                <p className="text-sm font-medium">Filters:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {wizardData.filters.map((filter, idx) => (
                    <li key={idx}>
                      • {filter.table}.{filter.column} {filter.operator} {filter.paramName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {wizardData.sorting && (
              <div>
                <p className="text-sm font-medium">Sorting:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {wizardData.sorting.table}.{wizardData.sorting.column} ({wizardData.sorting.direction})
                </p>
              </div>
            )}

            {wizardData.limit && (
              <div>
                <p className="text-sm font-medium">Limit:</p>
                <p className="text-sm text-muted-foreground mt-1">{wizardData.limit} results</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setWizardStep(3)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={handleComplete}>Generate Tool</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
