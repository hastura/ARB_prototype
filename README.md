# ARB_prototype

## Client feedback — 13 November 2026

Three new scroll-driven directions are available at `#/home/F` (Living Room), `#/home/G` (Amber Cinema), and `#/home/H` (Amber Collage), alongside A–E in the review hub. The updated navigation is About us / Ebook / Reflection. Footer social channels are explicitly requested dummy controls; the book floats on the page canvas and opens to a pending-excerpt state. EN remains the default. See `docs/CLIENT_FEEDBACK_2026-11-13.md` for source mapping, scope and QA.


Prototype interaktif **Aksa Rasa Bumi**, berdasarkan `ARB_Web_UI_Preview_v02.pdf` (25 halaman, UI Draft v04). Dibuat untuk review client pada desktop, tablet, dan mobile.

Bahasa default **EN**, dengan switch **EN / ID** di header. Pilihan tersimpan dan mengikuti navigasi serta simulator perangkat. Lihat `docs/LOCALIZATION.md`.

**[Buka ruang review](https://hastura.github.io/ARB_prototype/#/preview)** · **[Mulai alternatif E](https://hastura.github.io/ARB_prototype/#/home/E)**

## Isi preview

- Delapan Home: F / Living Room, G / Amber Cinema, H / Amber Collage, serta A / Potret Editorial, B / Ruang Percakapan, C / Langkah Bersama, D / Halaman Pembuka, E / Lapisan Kisah. F–H tampil pertama di hub; arah final tetap menunggu review client.
- Journey: Beranda → About us → Ebook → Detail Kisah → Bantuan, serta Reflection, state materi, menu mobile, accordion dan pemulihan 404. Navigasi aktif: About us / Ebook / Reflection; tautan lama Ngobrol tetap dapat dibuka langsung.
- Hub review dengan simulator viewport **1440 / 768 / 390 px**, semua alternatif, dan pilihan halaman. Layar penuh juga responsif mulai 320 px.
- GSAP: pembuka yang dapat dilewati, transisi halaman, reveal editorial, respons hover, shape reveal, indikator scroll, tiga hero dengan film yang dikontrol scroll, dan buku 3D yang dapat diputar serta dibuka. `prefers-reduced-motion` menghapus gerak dekoratif dan jeda tampil.
- Buku dibuat dengan HTML/CSS sebagai **mockup sampul sementara**. Bukan sampul atau SKU komersial yang disahkan.

## Batas konten

Copy berasal dari 112 string sumber dengan status, provenance, dan catatan di `src/copy-source.json`. Usulan editorial dan visual tetap draft. *The Art of Reflecting* adalah judul kisah; pemakaian sebagai identitas produk masih menunggu keputusan.

Harga, format, SKU, checkout, akses, cuplikan novel, episode, durasi, kontak, dan kebijakan tidak dikarang. Journey pembelian/cuplikannya menunjukkan status menunggu materi. Transaksi, audiobook dan kanal sosial belum terhubung ke layanan produksi. Film hero F–H berasal dari render yang disediakan; kanal sosial memakai dialog dummy yang diminta user. Tidak ada akun, cart, atau riwayat pembelian.

`docs/asset-manifest.json` mencatat sumber dan optimasi artwork. Hero E mempertahankan alignment tujuh layer dan karakter statis; gerak scenery maksimal ±2 piksel sumber. Hero E memakai gambar statis pada mobile dan reduced motion. Hero F–H memenuhi viewport tanpa bingkai dan langsung mengikuti scroll maju/mundur pada desktop maupun mobile, tanpa kontrol play/pause; reduced motion tetap statis. Pengenalan karakter A/B/F/G dibangun sebagai layer HTML/CSS/GSAP dari pose asli pada film yang diberikan pengguna: parallax, easing scroll maju/mundur, teks native EN/ID dan ensemble. Section ini tidak memuat MP4 karakter. H mempertahankan komposisi portrait GSAP sebelumnya. Reduced motion menampilkan tiga artikel lengkap dalam alur baca biasa. Manifest film dan gambar F–H tersedia di `docs/feedback-media.json`. Seluruh aset dikirim lokal, tanpa CDN runtime.

## Development

Gunakan Node.js 24 dan npm.

```sh
npm ci
npm run dev
```

```sh
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Navigasi menggunakan hash agar tautan dalam dapat dibuka langsung dan di-refresh di GitHub Pages. `?v=A` di dalam hash mempertahankan alternatif sepanjang journey.

## CI/CD & QA

Push `main` menjalankan build dan QA browser sebelum deploy Pages. Pull request menjalankan build/QA dan menghasilkan artifact preview yang dapat diunduh; setiap PR tidak memiliki deployment Pages terpisah. Lihat `docs/DEPLOYMENT.md` dan `docs/QA.md`.

Source PDF dan master desain dipertahankan di workspace proyek. Repository ini hanya memuat prototype, aset web, dan dokumentasi implementasi. Tidak ada PDF baru yang dibuat.
