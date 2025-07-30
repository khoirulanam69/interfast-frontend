
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mikrotikService } from '@/services/mikrotikService';

export const useUserStatusUpdater = () => {
  const isRunningRef = useRef(false);
  const retryQueueRef = useRef<Array<{ username: string; status: string; attempts: number }>>([]);

  useEffect(() => {
    const updateUserStatuses = async () => {
      // Prevent multiple simultaneous runs
      if (isRunningRef.current) {
        return;
      }

      isRunningRef.current = true;

      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*');

        if (error) {
          return;
        }

        if (!users || users.length === 0) {
          return;
        }

        const now = new Date();
        const updates = [];

        for (const user of users) {
          if (!user.expired_date) continue;

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
          }

          // Rule: Ubah status user menjadi terminate ketika user status inactive sampai 2 bulan
          if (user.user_status === 'Inactive' && monthsDiff >= 2) {
            newStatus = 'Terminate';
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            updates.push({
              id: user.id,
              user_status: newStatus,
              payment_status: newPaymentStatus,
              username_dial: user.username_dial
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

          // Try to update MikroTik status
          if (update.username_dial && (update.user_status === 'Inactive' || update.user_status === 'Terminate')) {
            await updateMikroTikWithRetry(update.username_dial, update.user_status);
          }
        }

        // Process retry queue
        await processRetryQueue();

      } catch (error) {
        console.error('Error in updateUserStatuses:', error);
      } finally {
        isRunningRef.current = false;
      }
    };

    const updateMikroTikWithRetry = async (username: string, status: string) => {
      try {
        const result = await mikrotikService.updateUserStatus(username, status);
        if (!result.success) {
          throw new Error('MikroTik update failed');
        }
        console.log(`Successfully updated MikroTik status for ${username} to ${status}`);
      } catch (error) {
        console.error(`Failed to update MikroTik status for ${username}:`, error);
        
        // Add to retry queue
        const existingRetry = retryQueueRef.current.find(item => item.username === username);
        if (existingRetry) {
          existingRetry.attempts += 1;
          existingRetry.status = status;
        } else {
          retryQueueRef.current.push({
            username,
            status,
            attempts: 1
          });
        }
      }
    };

    const processRetryQueue = async () => {
      if (retryQueueRef.current.length === 0) return;

      console.log(`Processing retry queue with ${retryQueueRef.current.length} items`);
      
      const itemsToRetry = [...retryQueueRef.current];
      retryQueueRef.current = [];

      for (const item of itemsToRetry) {
        if (item.attempts >= 10) {
          console.error(`Max retry attempts reached for ${item.username}, removing from queue`);
          continue;
        }

        try {
          const result = await mikrotikService.updateUserStatus(item.username, item.status);
          if (!result.success) {
            throw new Error('MikroTik update failed');
          }
          console.log(`Successfully updated MikroTik status for ${item.username} to ${item.status} after ${item.attempts} attempts`);
        } catch (error) {
          console.error(`Retry failed for ${item.username} (attempt ${item.attempts}):`, error);
          
          // Add back to retry queue with incremented attempts
          retryQueueRef.current.push({
            ...item,
            attempts: item.attempts + 1
          });
        }
      }
    };

    // Run immediately but with a small delay to prevent blocking initial render
    const initialTimeout = setTimeout(updateUserStatuses, 2000);

    // Run every 5 minutes for main function
    const mainInterval = setInterval(updateUserStatuses, 5 * 60 * 1000);

    // Run retry queue processing every 5 minutes as well
    const retryInterval = setInterval(processRetryQueue, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(mainInterval);
      clearInterval(retryInterval);
      isRunningRef.current = false;
      retryQueueRef.current = [];
    };
  }, []);
};
