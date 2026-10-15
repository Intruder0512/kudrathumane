import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FilterBar from './FilterBar';
import StatsCard from './StatsCard';
import { IndianRupee } from 'lucide-react';

const DonationsTable = ({ payments }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Filter for completed payments (donations)
  const completedPayments = payments.filter(p => p.status === 'completed');

  const filteredDonations = completedPayments.filter(payment => {
    if (dateRange.from && new Date(payment.payment_date) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(payment.payment_date) > new Date(dateRange.to)) return false;
    return true;
  });

  const totalDonations = filteredDonations.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Donations (Filtered)" 
          value={`₹${totalDonations.toLocaleString()}`} 
          icon={IndianRupee} 
          description={`${filteredDonations.length} successful transactions`}
        />
      </div>

      <FilterBar 
        dateRange={dateRange} 
        setDateRange={setDateRange}
      />

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Adoption Ref</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No donations found for this period.
                </TableCell>
              </TableRow>
            ) : (
              filteredDonations.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{payment.adoption_id || 'Direct'}</TableCell>
                  <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{payment.payment_method || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DonationsTable;