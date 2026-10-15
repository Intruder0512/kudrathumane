import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import FilterBar from './FilterBar';

const VirtualAdoptionsTable = ({ adoptions, dogsMap }) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAdoptions = adoptions.filter(adoption => {
    if (statusFilter !== 'all' && adoption.payment_status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <FilterBar 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter}
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'pending', label: 'Pending' },
          { value: 'cancelled', label: 'Cancelled' }
        ]}
      />

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dog Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Monthly Amount</TableHead>
              <TableHead>Adoption Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdoptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No adoptions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAdoptions.map((adoption) => (
                <TableRow key={adoption.id}>
                  <TableCell className="font-medium">
                    {dogsMap[adoption.dog_id]?.name || adoption.dog_id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {adoption.user_id}
                  </TableCell>
                  <TableCell>₹{adoption.monthly_amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(adoption.adoption_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      adoption.payment_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      adoption.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {adoption.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VirtualAdoptionsTable;