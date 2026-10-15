import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, QrCode, RefreshCw, Dog, Bell, Users, IndianRupee, AlertCircle, Package, HeartHandshake, MicOff as Microchip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pb from '@/lib/pocketbaseClient';
import { getDeterministicDogImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

// Admin Components
import StatsCard from '@/components/admin/StatsCard';
import DogManagementModal from '@/components/admin/DogManagementModal';
import DeleteDogModal from '@/components/admin/DeleteDogModal';
import QRCodeManagementModal from '@/components/admin/QRCodeManagementModal';
import MedicalRecordsTab from '@/components/admin/MedicalRecordsTab';
import RescueOperationsTab from '@/components/admin/RescueOperationsTab';
import ReportsTab from '@/components/admin/ReportsTab';
import VaccinationScheduleWidget from '@/components/admin/VaccinationScheduleWidget';
import VirtualAdoptionsTable from '@/components/admin/VirtualAdoptionsTable';
import DonationsTable from '@/components/admin/DonationsTable';
import PaymentsTable from '@/components/admin/PaymentsTable';
import InKindDonationsTab from '@/components/admin/InKindDonationsTab';
import VolunteerManagementTab from '@/components/admin/VolunteerManagementTab';
import InventoryTrackerTab from '@/components/admin/InventoryTrackerTab';
import MicrochipRegistryTab from '@/components/admin/MicrochipRegistryTab';
import FosterFamilyManagementTab from '@/components/admin/FosterFamilyManagementTab';
import LostFoundManagementTab from '@/components/admin/LostFoundManagementTab';
import AdoptionCertificatesTab from '@/components/admin/AdoptionCertificatesTab';
import SocialMediaTab from '@/components/admin/SocialMediaTab';
import AdoptionsTab from '@/components/admin/AdoptionsTab';

const AdminDashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [dogModalOpen, setDogModalOpen] = useState(false);
  const [deleteDogModalOpen, setDeleteDogModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState(null);
  
  // Maps for quick lookup
  const [dogsMap, setDogsMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dogsData, adoptionsData, paymentsData] = await Promise.all([
        pb.collection('dogs').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('virtual_adoptions').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('payments').getFullList({ sort: '-created', $autoCancel: false })
      ]);

      setDogs(dogsData);
      setAdoptions(adoptionsData);
      setPayments(paymentsData);

      const dMap = {};
      dogsData.forEach(d => { dMap[d.id] = d; });
      setDogsMap(dMap);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadgeStyle = (status) => {
    const slug = status?.replace(/ /g, '-');
    return `bg-[hsl(var(--status-${slug}))] text-white`;
  };

  // Derived Stats
  const totalDogs = dogs.length;
  const activeAdoptions = adoptions.filter(a => a.payment_status === 'active').length;
  const totalFunds = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  if (loading && dogs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-20 bg-muted/30">
          <div className="container max-w-7xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Admin Dashboard - Kudrat Humane Living</title></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-12 bg-muted/30">
          <div className="container max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="mb-2 font-semibold border-b pb-2">Upcoming Vaccinations</div>
                    <VaccinationScheduleWidget dogsMap={dogsMap} />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-background border shadow-sm w-full justify-start overflow-x-auto flex-nowrap h-auto py-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dogs">Dogs</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="rescues">Rescues</TabsTrigger>
                <TabsTrigger value="adoptions">Adoptions</TabsTrigger>
                <TabsTrigger value="foster">Foster</TabsTrigger>
                <TabsTrigger value="lostfound">Lost/Found</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="donations">Donations</TabsTrigger>
                <TabsTrigger value="inkind">In-Kind</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="microchips">Microchips</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard title="Total Dogs" value={totalDogs} icon={Dog} description="Registered in system" />
                  <StatsCard title="Active Adoptions" value={activeAdoptions} icon={Users} description="Currently active" />
                  <StatsCard title="Total Funds Raised" value={`₹${totalFunds.toLocaleString()}`} icon={IndianRupee} description="From completed payments" />
                  <StatsCard title="Pending Payments" value={pendingPayments} icon={AlertCircle} description="Awaiting confirmation" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Adoptions</h3>
                    <div className="space-y-4">
                      {adoptions.slice(0, 5).map(adoption => (
                        <div key={adoption.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{dogsMap[adoption.dog_id]?.name || 'Unknown Dog'}</p>
                            <p className="text-sm text-muted-foreground font-mono">{adoption.user_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{adoption.monthly_amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(adoption.adoption_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {adoptions.length === 0 && <p className="text-sm text-muted-foreground">No recent adoptions.</p>}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
                    <div className="space-y-4">
                      {payments.slice(0, 5).map(payment => (
                        <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground font-mono">{payment.adoption_id || 'Direct Donation'}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && <p className="text-sm text-muted-foreground">No recent payments.</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dogs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Dogs Directory</h2>
                  <Button onClick={() => { setSelectedDog(null); setDogModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Dog
                  </Button>
                </div>
                <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Health Status</TableHead>
                        <TableHead>System Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dogs.map((dog) => (
                        <TableRow key={dog.id}>
                          <TableCell>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                              <img src={dog.photo ? pb.files.getUrl(dog, dog.photo) : getDeterministicDogImage(dog.id)} alt={dog.name} className="w-full h-full object-cover" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {dog.name} <span className="text-xs text-muted-foreground block">{dog.breed}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getHealthBadgeStyle(dog.health_status)}`}>
                              {dog.health_status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm px-2 py-1 border rounded-md">{dog.status}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedDog(dog); setDogModalOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedDog(dog); setDeleteDogModalOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {dogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No dogs found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="medical"><MedicalRecordsTab dogsMap={dogsMap} /></TabsContent>
              <TabsContent value="rescues"><RescueOperationsTab dogsMap={dogsMap} /></TabsContent>
              <TabsContent value="adoptions"><AdoptionsTab dogsMap={dogsMap} /></TabsContent>
              <TabsContent value="foster"><FosterFamilyManagementTab /></TabsContent>
              <TabsContent value="lostfound"><LostFoundManagementTab /></TabsContent>
              <TabsContent value="certificates"><AdoptionCertificatesTab /></TabsContent>
              <TabsContent value="social"><SocialMediaTab /></TabsContent>
              <TabsContent value="reports"><ReportsTab /></TabsContent>
              <TabsContent value="donations"><DonationsTable payments={payments} /></TabsContent>
              <TabsContent value="inkind"><InKindDonationsTab /></TabsContent>
              <TabsContent value="volunteers"><VolunteerManagementTab /></TabsContent>
              <TabsContent value="inventory"><InventoryTrackerTab /></TabsContent>
              <TabsContent value="microchips"><MicrochipRegistryTab /></TabsContent>

            </Tabs>
          </div>
        </main>
        <Footer />
      </div>

      <DogManagementModal isOpen={dogModalOpen} onClose={() => setDogModalOpen(false)} dog={selectedDog} onSuccess={fetchData} />
      <DeleteDogModal isOpen={deleteDogModalOpen} onClose={() => setDeleteDogModalOpen(false)} dog={selectedDog} onSuccess={fetchData} />
      <QRCodeManagementModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </>
  );
};

export default AdminDashboard;