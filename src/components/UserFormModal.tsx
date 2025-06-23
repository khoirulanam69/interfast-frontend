
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: () => void;
  users: any[];
}

const UserFormModal = ({ isOpen, onClose, user, onSave, users }: UserFormModalProps) => {
  const [packages, setPackages] = useState([]);
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
    package: 'Interfast Bronze' as 'Interfast Bronze' | 'Interfast Silver' | 'Interfast Gold' | 'Interfast Platinum',
    price: 100000,
    referred_by: null as string | null,
    installation_date: new Date().toISOString().split('T')[0], // ← default hari ini
    username_dial: '', // ← ditambahkan
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch packages from database
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Generate expired date (30 days from installation)
  const generateExpiredDate = (installationDate: string) => {
    const installDate = new Date(installationDate);
    const expiredDate = new Date(installDate);
    expiredDate.setDate(expiredDate.getDate() + 30);
    return expiredDate.toISOString().split('T')[0];
  };

  // Check if payment should be unpaid (expired date within 3 days)
  const shouldSetUnpaid = (expiredDate: string) => {
    const today = new Date();
    const expired = new Date(expiredDate);
    const diffTime = expired.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
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
        package: user.package || 'Interfast Bronze',
        price: user.price || 100000,
        referred_by: user.referred_by || null,
        installation_date: user.installation_date || new Date().toISOString().split('T')[0],
        username_dial: user.username_dial || '',
      });
    } else {
      // Reset form for new user
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
        package: 'Interfast Bronze',
        price: 100000,
        referred_by: null,
        installation_date: new Date().toISOString().split('T')[0],
        username_dial: '',
      });
    }
  }, [user]);

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
        username_dial: formData.username_dial,
      };

      if (user) {
        // Update existing user - DO NOT include username_dial, installation_date, expired_date, user_status
        const { error } = await supabase
          .from('users')
          .update({
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
            referred_by: formData.referred_by === 'none' ? null : formData.referred_by
          })
          .eq('id', user.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user - auto-generate dates and username_dial, set status to Active
        const installationDate = formData.installation_date;
        const expiredDate = generateExpiredDate(installationDate);
        const paymentStatus = shouldSetUnpaid(expiredDate) ? 'Unpaid' : 'Paid';

        const { error } = await supabase
          .from('users')
          .insert({
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
            installation_date: installationDate,
            expired_date: expiredDate,
            payment_status: paymentStatus,
            user_status: 'Active',
            username_dial: formData.username_dial
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "User created successfully with Active status",
        });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
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
    const price = selectedPackage ? selectedPackage.price : 100000;
    
    setFormData({ 
      ...formData, 
      package: value as 'Interfast Bronze' | 'Interfast Silver' | 'Interfast Gold' | 'Interfast Platinum', 
      price: price
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
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
              <Label htmlFor="username_dial">Username Dial</Label>
              <Input
                id="username_dial"
                value={formData.username_dial}
                onChange={(e) => setFormData({ ...formData, username_dial: e.target.value })}
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
