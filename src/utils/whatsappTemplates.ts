import { formatDateForMessage } from './dateUtils';

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Hitung selisih hari dari sekarang (WIB) ke tanggal expired.
 * Positif = masih ada sisa hari, 0 = hari ini, negatif = sudah lewat.
 */
function getDaysUntilExpired(expiredDate: string): number {
  const now = new Date();

  // Ambil tanggal hari ini dalam WIB (tanpa jam)
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = todayParts.find(p => p.type === 'year')!.value;
  const m = todayParts.find(p => p.type === 'month')!.value;
  const d = todayParts.find(p => p.type === 'day')!.value;

  // Tanggal hari ini (00:00 WIB)
  const today = new Date(`${y}-${m}-${d}T00:00:00+07:00`);

  // Tanggal expired dianggap sebagai hari terakhir aktif (00:00 WIB)
  const expired = new Date(`${expiredDate.split('T')[0]}T00:00:00+07:00`);

  // Selisih hari (tanpa pembulatan ke atas)
  const diffDays = Math.floor(
    (expired.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // +1 agar tanggal expired tetap dihitung sebagai hari aktif terakhir
  return diffDays + 1;
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

Pembayaran dapat dilakukan melalui berbagai metode berikut:
🔸 Dompet digital: ShopeePay, OVO, DANA
🔸 Gerai retail: Indomaret, Alfamart
🔸 Transfer bank: BCA, BRI, BNI, Mandiri

Rekening Tujuan:
🏦 Bank BCA
💳 No. Rekening: 1240640712
👤 a.n. Muhammad Khoirul Anam

Atau pembayaran dapat dilakukan langsung ke alamat berikut:
📞 WhatsApp: +62 896-0262-9248
📌 Alamat: Jl. Blambangan No.35 RT 01 / RW 05, Dampit, Kab. Malang
🔗 Lokasi Google Maps: https://maps.app.goo.gl/UYwZdBPS8LKy9Gii6

📢 Setelah melakukan pembayaran, mohon segera konfirmasi kepada admin untuk mempercepat proses verifikasi.

Apabila Anda mengalami kendala atau memiliki keluhan terkait layanan internet selama satu bulan terakhir, silakan sampaikan kepada admin agar dapat segera ditindaklanjuti.

Terima kasih atas kepercayaan Anda menggunakan layanan kami.

Hormat kami,
Tim Interfast Media`;
}
