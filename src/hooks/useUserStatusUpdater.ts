
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mikrotikService } from '@/services/mikrotikService';

export const useUserStatusUpdater = () => {
  useEffect(() => {
    const updateUserStatuses = async () => {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*');

        if (error) {
          console.error('Error fetching users for status update:', error);
          return;
        }

        const now = new Date();
        const updates = [];

        for (const user of users) {
          const expiredDate = new Date(user.expired_date);
          const daysDiff = Math.ceil((expiredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const monthsDiff = Math.ceil((now.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

          let shouldUpdate = false;
          let newStatus = user.user_status;
          let newPaymentStatus = user.payment_status;

          // Rule: Jika kurang 3 hari dari expired date maka ubah status payment menjadi Unpaid
          if (daysDiff <= 3 && daysDiff > 0 && user.payment_status === 'Paid') {
            newPaymentStatus = 'Unpaid';
            shouldUpdate = true;
          }

          // Rule: Ubah status user menjadi inactive, Jika status payment unpaid sampai lebih dari tanggal expired date
          if (now > expiredDate && user.payment_status === 'Unpaid' && user.user_status === 'Active') {
            newStatus = 'Inactive';
            shouldUpdate = true;
            
            // Update MikroTik status
            try {
              await mikrotikService.updateUserStatus(user.username_dial, 'Inactive');
            } catch (error) {
              console.error(`Failed to update MikroTik status for ${user.username_dial}:`, error);
            }
          }

          // Rule: Ubah status user menjadi terminate ketika user status inactive sampai 2 bulan
          if (user.user_status === 'Inactive' && monthsDiff >= 2) {
            newStatus = 'Terminate';
            shouldUpdate = true;
            
            // Update MikroTik status
            try {
              await mikrotikService.updateUserStatus(user.username_dial, 'Terminate');
            } catch (error) {
              console.error(`Failed to update MikroTik status for ${user.username_dial}:`, error);
            }
          }

          if (shouldUpdate) {
            updates.push({
              id: user.id,
              user_status: newStatus,
              payment_status: newPaymentStatus
            });
          }
        }

        // Batch update database
        for (const update of updates) {
          await supabase
            .from('users')
            .update({
              user_status: update.user_status,
              payment_status: update.payment_status
            })
            .eq('id', update.id);
        }

        if (updates.length > 0) {
          console.log(`Updated ${updates.length} user statuses`);
        }

      } catch (error) {
        console.error('Error in user status updater:', error);
      }
    };

    // Run immediately
    updateUserStatuses();

    // Run every hour
    const interval = setInterval(updateUserStatuses, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
