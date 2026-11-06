# ARB_prototype

Prototype interaktif **Aksa Rasa Bumi**, berdasarkan `ARB_Web_UI_Preview_v02.pdf` (25 halaman, UI Draft v04). Dibuat untuk review client pada desktop, tablet, dan mobile.

**[Buka ruang review](https://hastura.github.io/ARB_prototype/#/preview)** · **[Mulai alternatif E](https://hastura.github.io/ARB_prototype/#/home/E)**

## Isi preview

- Lima Home: A / Potret Editorial, B / Ruang Percakapan, C / Langkah Bersama, D / Halaman Pembuka, E / Lapisan Kisah. E adalah layar awal preview, bukan keputusan arah final.
- Journey: Beranda → Kisah & Karakter → Ebook → Detail Kisah → Bantuan. Renungan, Ngobrol, state materi, menu mobile, accordion, dan pemulihan 404 terhubung.
- Hub review dengan simulator viewport **1440 / 768 / 390 px**, semua alternatif, dan pilihan halaman. Layar penuh juga responsif mulai 320 px.
- GSAP: pembuka yang dapat dilewati, transisi halaman, reveal editorial, respons hover, shape reveal, indikator scroll, dan buku 3D yang dapat diputar. `prefers-reduced-motion` menghapus gerak dekoratif dan jeda tampil.
- Buku dibuat dengan HTML/CSS sebagai **mockup sampul sementara**. Bukan sampul atau SKU komersial yang disahkan.

## Batas konten

Copy berasal dari 112 string sumber dengan status, provenance, dan catatan di `src/copy-source.json`. Usulan editorial dan visual tetap draft. *The Art of Reflecting* adalah judul kisah; pemakaian sebagai identitas produk masih menunggu keputusan.

Harga, format, SKU, checkout, akses, cuplikan novel, episode, durasi, kontak, dan kebijakan tidak dikarang. Journey pembelian/cuplikannya menunjukkan status menunggu materi. Tidak ada transaksi, pemutaran media, atau tautan platform palsu. Tidak ada akun, cart, atau riwayat pembelian.

`docs/asset-manifest.json` mencatat sumber dan optimasi artwork. Hero E mempertahankan alignment tujuh layer dan karakter statis; gerak scenery maksimal ±2 piksel sumber. Mobile dan reduced motion memakai gambar statis. Seluruh aset dikirim lokal, tanpa CDN runtime.

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
