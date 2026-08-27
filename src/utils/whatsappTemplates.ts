import { formatDateForMessage } from './dateUtils';

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Hitung selisih hari dari sekarang (WIB) ke tanggal expired.
 * Positif = masih ada sisa hari, 0 = hari ini, negatif = sudah lewat.
 */
function getDaysUntilExpired(expiredDate: string): number {
  const now = new Date();
  const expired = new Date(expiredDate);

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const expiredStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(expired);

  const today = new Date(todayStr);
  const exp = new Date(expiredStr);

  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

/**
 * Generate kalimat dinamis berdasarkan sisa hari menuju expired.
 */
function getExpiryMessage(daysLeft: number): string {
  if (daysLeft > 1) {
    return `masa aktif layanan internet Anda akan berakhir dalam *${daysLeft} hari* ke depan. Untuk menghindari gangguan layanan, segera lakukan pembayaran sebelum masa aktif berakhir.`;
  }
  if (daysLeft === 1) {
    return `masa aktif layanan internet Anda akan berakhir *besok*. Segera lakukan pembayaran hari ini untuk menghindari gangguan layanan.`;
  }
  if (daysLeft === 0) {
    return `*hari ini adalah hari terakhir* masa aktif layanan internet Anda. Segera lakukan pembayaran sekarang agar layanan tidak terputus.`;
  }
  // Sudah expired
  const overdue = Math.abs(daysLeft);
  return `masa aktif layanan internet Anda telah *berakhir ${overdue} hari yang lalu*. Segera lakukan pembayaran untuk mengaktifkan kembali layanan Anda.`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface WhatsAppUser {
  name: string;
  package: string;
  price: number;
  expired_date: string;
  phone: string;
}

/**
 * Build pesan WhatsApp notifikasi expired yang dinamis.
 */
export function buildExpiredNotificationMessage(user: WhatsAppUser): string {
  const daysLeft = getDaysUntilExpired(user.expired_date);
  const expiryLine = getExpiryMessage(daysLeft);

  return `Yth. Bapak/Ibu ${user.name},

Kami informasikan bahwa ${expiryLine}

Tagihan layanan WiFi Anda untuk bulan berikutnya telah diterbitkan dengan rincian sebagai berikut:

📶 Paket Layanan : ${user.package}
💰 Jumlah Tagihan : ${formatCurrency(user.price)}
📅 Jatuh Tempo : ${formatDateForMessage(user.expired_date)}

Rekening Tujuan:
🏦 Bank BNI
💳 No. Rekening: 1274687322
👤 a.n. Muhammad Khoirul Anam

Atau pembayaran dapat dilakukan langsung ke alamat berikut:
📞 WhatsApp: 0896-0262-9248
📌 Alamat: Jl. Blambangan No.35 RT 01 / RW 05, Dampit, Kab. Malang
🔗 Lokasi Google Maps: https://maps.app.goo.gl/UYwZdBPS8LKy9Gii6

📢 Setelah melakukan pembayaran, mohon segera konfirmasi ke nomor diatas untuk mempercepat proses verifikasi.

Terima kasih atas kepercayaan Anda menggunakan layanan kami.

Hormat kami,
Tim Interfast Media`;
}
