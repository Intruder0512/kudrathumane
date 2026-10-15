import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent } from '@/components/ui/card';

const VaccinationScheduleWidget = ({ dogsMap }) => {
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        const isoToday = today.toISOString().split('T')[0];
        const isoFuture = thirtyDaysLater.toISOString().split('T')[0];

        const records = await pb.collection('vaccinations').getFullList({
          filter: `next_due_date >= "${isoToday}" && next_due_date <= "${isoFuture}"`,
          sort: 'next_due_date',
          $autoCancel: false
        });
        setUpcoming(records);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUpcoming();
  }, []);

  if (upcoming.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No vaccines due in the next 30 days.</div>;
  }

  return (
    <div className="space-y-2 p-2 max-h-96 overflow-y-auto">
      {upcoming.map(v => {
        const dogName = dogsMap[v.dog_id]?.name || 'Unknown';
        const due = new Date(v.next_due_date);
        const diffDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        
        let colorClass = 'bg-[hsl(var(--alert-up-to-date))] text-white';
        if (diffDays <= 0) colorClass = 'bg-[hsl(var(--alert-overdue))] text-white';
        else if (diffDays <= 6) colorClass = 'bg-[hsl(var(--alert-due-soon))] text-white';

        return (
          <Card key={v.id} className="shadow-none">
            <CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{dogName}</p>
                <p className="text-xs text-muted-foreground">{v.vaccine_name}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${colorClass}`}>
                  {diffDays <= 0 ? 'OVERDUE' : `${diffDays} days`}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">{due.toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VaccinationScheduleWidget;