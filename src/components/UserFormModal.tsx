import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { mikrotikService } from '@/services/mikrotikService';
import { toDateInputWIB } from '@/utils/dateUtils';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: () => void;
  users: any[];
}

const UserFormModal = ({ isOpen, onClose, user, onSave, users }: UserFormModalProps) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    address: '',
    rt_rw: '',
    village: '',
    city: '',
    province: '',
    country: 'Indonesia',
    phone: '',
    package: '',
    price: 0,
    referred_by: null as string | null,
    installation_date: '',
    expired_date: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch packages from database
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await databaseService.getPackages();
      const pkgList = data || [];
      setPackages(pkgList);
      // Set default package from first available package (only for new user)
      if (!user && pkgList.length > 0 && !formData.package) {
        setFormData(prev => ({
          ...prev,
          package: pkgList[0].name,
          price: pkgList[0].price,
        }));
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Generate expired date (30 days from installation)
  const generateExpiredDate = (installationDate: string) => {
    const installDate = new Date(installationDate);
    const expiredDate = new Date(installDate);
    expiredDate.setDate(expiredDate.getDate() + 30);
    return toDateInputWIB(expiredDate.toISOString());
  };

  // Check if payment should be unpaid (expired date within 3 days)
  const shouldSetUnpaid = (expiredDate: string) => {
    const today = new Date();
    const expired = new Date(expiredDate);
    const diffTime = expired.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  // Generate PPPoE username: name-address (lowercase, no spaces, only alphanumeric, dot, hyphen)
  const generatePPPoEUsername = (name: string, address: string, existingUsers: any[]) => {
    const sanitize = (str: string) => str
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9.\-]/g, '');
    const base = `${sanitize(name)}-${sanitize(address)}`;
    
    // Check uniqueness against existing users
    const existingUsernames = existingUsers.map(u => u.username_dial);
    if (!existingUsernames.includes(base)) return base;
    
    let counter = 2;
    while (existingUsernames.includes(`${base}${counter}`)) {
      counter++;
    }
    return `${base}${counter}`;
  };

  // Generate PPPoE password: last 6 digits of NIK
  const generatePPPoEPassword = (nik: string) => {
    return nik.slice(-6);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        nik: user.nik || '',
        name: user.name || '',
        address: user.address || '',
        rt_rw: user.rt_rw || '',
        village: user.village || '',
        city: user.city || '',
        province: user.province || '',
        country: user.country || 'Indonesia',
        phone: user.phone || '',
        package: user.package || '',
        price: user.price || 0,
        referred_by: user.referred_by || null,
        installation_date: toDateInputWIB(user.installation_date || ''),
        expired_date: toDateInputWIB(user.expired_date || ''),
      });
    } else {
      // Reset form for new user - completely empty
      const defaultPkg = packages.length > 0 ? packages[0] : null;
      setFormData({
        nik: '',
        name: '',
        address: '',
        rt_rw: '',
        village: '',
        city: '',
        province: '',
        country: 'Indonesia',
        phone: '',
        package: defaultPkg?.name || '',
        price: defaultPkg?.price || 0,
        referred_by: null,
        installation_date: '',
        expired_date: '',
      });
    }
  }, [user, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const dataToSubmit = {
        nik: formData.nik,
        name: formData.name,
        address: formData.address,
        rt_rw: formData.rt_rw,
        village: formData.village,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        phone: formData.phone,
        package: formData.package,
        price: formData.price,
        referred_by: formData.referred_by === 'none' ? null : formData.referred_by,
        installation_date: formData.installation_date,
        expired_date: formData.expired_date,
      };

      if (user) {
        // Update existing user
        await databaseService.updateUser(user.id, dataToSubmit);
        
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        const paymentStatus = shouldSetUnpaid(formData.expired_date) ? 'Unpaid' : 'Paid';
        
        // Generate PPPoE credentials
        const pppoeUsername = generatePPPoEUsername(formData.name, formData.address, users);
        const pppoePassword = generatePPPoEPassword(formData.nik);

        const createdUser = await databaseService.createUser({
          ...dataToSubmit,
          username_dial: pppoeUsername,
          password_pppoe: pppoePassword,
          payment_status: paymentStatus,
          user_status: 'Active'
        });

        // Auto-create installation transaction
        try {
          await databaseService.createTransaction({
            transaction_type: 'income',
            category: 'installation',
            amount: formData.price,
            transaction_date: formData.installation_date,
            description: `Pembayaran biaya instalasi pelanggan ${formData.name}`,
            user_id: createdUser?.id || null,
          });
        } catch (txError: any) {
          console.error('Auto transaction error:', txError);
          // Non-blocking: user was created, just log the error
        }

        // Create PPPoE Secret in MikroTik
        try {
          const mikrotikResult = await mikrotikService.createPPPSecret(
            pppoeUsername,
            pppoePassword,
            formData.package.toLowerCase()
          );

          if (mikrotikResult.success) {
            toast({
              title: "Success",
              description: `User created and PPPoE Secret registered in MikroTik (${pppoeUsername})`,
            });
          } else {
            toast({
              title: "Partial Success",
              description: `User created but failed to register in MikroTik: ${mikrotikResult.message}`,
              variant: "destructive",
            });
          }
        } catch (mikrotikError: any) {
          console.error('MikroTik error:', mikrotikError);
          toast({
            title: "Partial Success",
            description: `User created but MikroTik registration failed: ${mikrotikError.message}`,
            variant: "destructive",
          });
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePackageChange = (value: string) => {
    const selectedPackage = packages.find(pkg => pkg.name === value);
    setFormData({ 
      ...formData, 
      package: value, 
      price: selectedPackage?.price || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information below.' : 'Fill in the information to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="rt_rw">RT/RW</Label>
              <Input
                id="rt_rw"
                value={formData.rt_rw}
                onChange={(e) => setFormData({ ...formData, rt_rw: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="province">Province</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="package">Package</Label>
              <Select value={formData.package} onValueChange={handlePackageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.name}>
                      {pkg.name} - {pkg.bandwidth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Price (IDR)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="expired_date">Expired Date</Label>
              <Input
                id="expired_date"
                type="date"
                value={formData.expired_date}
                onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="referred_by">Referred By (Optional)</Label>
              <Select value={formData.referred_by || "none"} onValueChange={(value) => setFormData({ ...formData, referred_by: value === "none" ? null : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referring user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No referrer</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.nik})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
