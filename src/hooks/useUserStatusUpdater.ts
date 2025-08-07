import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mikrotikService } from '@/services/mikrotikService';

type UserStatus = 'Active' | 'Inactive' | 'Terminate';

export const useUserStatusUpdater = () => {
  const isRunningRef = useRef(false);
  const retryQueueRef = useRef<Array<{ username: string; status: UserStatus; attempts: number }>>([]);

  // Function to send WhatsApp message
  const sendWhatsAppMessage = (user: any) => {
    const message = `Yth. Bapak/Ibu ${user.name},

Kami informasikan bahwa masa aktif layanan internet Anda akan berakhir dalam 3 hari ke depan. Untuk menghindari gangguan layanan, segera lakukan pembayaran sebelum masa aktif berakhir.

Tagihan layanan WiFi Anda untuk bulan berikutnya telah diterbitkan dengan rincian sebagai berikut:

📶 Paket Layanan : ${user.package}
💰 Jumlah Tagihan : ${formatCurrency(user.price)}
📅 Jatuh Tempo : ${formatDate(user.expired_date)}

Pembayaran dapat dilakukan melalui berbagai metode berikut:
🔸 Dompet digital: ShopeePay, OVO, DANA
🔸 Gerai retail: Indomaret, Alfamart
🔸 Transfer bank: BCA, BRI, BNI, Mandiri

Rekening Tujuan:
🏦 Bank BCA
💳 No. Rekening: 1240640712
👤 a.n. Muhammad Khoirul Anam

Atau pembayaran dapat dilakukan langsung ke alamat berikut:
📞 WhatsApp: 0813-5733-3886
📌 Alamat: Jl. Blambangan No.35 RT 01 / RW 05, Dampit, Kab. Malang
🔗 Lokasi Google Maps: https://maps.app.goo.gl/UYwZdBPS8LKy9Gii6

📢 Setelah melakukan pembayaran, mohon segera konfirmasi kepada admin untuk mempercepat proses verifikasi.

Apabila Anda mengalami kendala atau memiliki keluhan terkait layanan internet selama satu bulan terakhir, silakan sampaikan kepada admin agar dapat segera ditindaklanjuti.

Terima kasih atas kepercayaan Anda menggunakan layanan kami.

Hormat kami,
Tim Interfast Media`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    // Open WhatsApp link in a new tab
    window.open(whatsappUrl, '_blank');
    
    console.log(`WhatsApp message sent to ${user.name} (${user.phone})`);
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

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
          let shouldSendWhatsApp = false;

          // Rule: Jika kurang 3 hari dari expired date maka ubah status payment menjadi Unpaid
          if (daysDiff <= 3 && daysDiff > 0 && user.payment_status === 'Paid') {
            newPaymentStatus = 'Unpaid';
            shouldUpdate = true;
            shouldSendWhatsApp = true; // Send WhatsApp when payment becomes unpaid
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
              username_dial: user.username_dial,
              shouldSendWhatsApp,
              userInfo: user // Store complete user info for WhatsApp message
            });
          }
        }

        // Process updates - only update database if MikroTik update succeeds
        for (const update of updates) {
          // Try to update MikroTik first
          if (update.username_dial && (update.user_status === 'Inactive' || update.user_status === 'Terminate')) {
            const mikrotikSuccess = await updateMikroTikWithRetry(update.username_dial, update.user_status as UserStatus);
            
            // Only update database if MikroTik update was successful
            if (mikrotikSuccess) {
              await supabase
                .from('users')
                .update({
                  user_status: update.user_status,
                  payment_status: update.payment_status
                })
                .eq('id', update.id);

              // Send WhatsApp message if needed
              if (update.shouldSendWhatsApp) {
                sendWhatsAppMessage(update.userInfo);
              }
            }
          } else {
            // If no MikroTik update needed, update database directly
            await supabase
              .from('users')
              .update({
                user_status: update.user_status,
                payment_status: update.payment_status
              })
              .eq('id', update.id);

            // Send WhatsApp message if needed
            if (update.shouldSendWhatsApp) {
              sendWhatsAppMessage(update.userInfo);
            }
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

    const updateMikroTikWithRetry = async (username: string, status: UserStatus): Promise<boolean> => {
      try {
        const result = await mikrotikService.updateUserStatus(username, status);
        if (!result.success) {
          throw new Error('MikroTik update failed');
        }
        console.log(`Successfully updated MikroTik status for ${username} to ${status}`);
        return true;
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
        return false;
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
          
          // Now update the database since MikroTik update succeeded
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('username_dial', item.username)
            .single();

          if (user) {
            const now = new Date();
            const expiredDate = new Date(user.expired_date);
            const daysDiff = Math.ceil((expiredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const monthsDiff = Math.ceil((now.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

            let newStatus = user.user_status;
            let newPaymentStatus = user.payment_status;

            // Apply the same rules as in the main update function
            if (daysDiff <= 3 && daysDiff > 0 && user.payment_status === 'Paid') {
              newPaymentStatus = 'Unpaid';
            }

            if (now > expiredDate && user.payment_status === 'Unpaid' && user.user_status === 'Active') {
              newStatus = 'Inactive';
            }

            if (user.user_status === 'Inactive' && monthsDiff >= 2) {
              newStatus = 'Terminate';
            }

            // Only update if the status matches what we updated in MikroTik
            if (newStatus === item.status) {
              await supabase
                .from('users')
                .update({
                  user_status: newStatus,
                  payment_status: newPaymentStatus
                })
                .eq('id', user.id);
            }
          }
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
