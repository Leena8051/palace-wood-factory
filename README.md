# 🪵 مصنع أخشاب القصور — Palace Wood Factory ERP

نظام إدارة متكامل لمصنع أخشاب القصور للأعمال الخشبية. يدير دورة حياة الطلب كاملة:
العملاء، الطلبات، التصنيع، الشكاوى، الصيانة، المخزون، المدفوعات، والتقارير.

> **حالة المرحلة 1**: ✅ المنصة جاهزة (Auth + i18n + Layout + Dashboard skeleton).
> الوحدات الوظيفية الكاملة (Customers, Orders, Complaints, …) تأتي في مراحل لاحقة.

---

## 🏗️ الـ Stack التقني

| الطبقة | التقنية |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React 19.2) |
| Language | TypeScript 5 (strict) |
| UI | Tailwind CSS v4 + shadcn-style components + lucide-react |
| State / Forms | react-hook-form + Zod |
| i18n | next-intl 4 (`ar` / `en` + RTL/LTR) |
| Auth | NextAuth v5 (Auth.js, Credentials provider, JWT sessions) |
| ORM / DB | Prisma 7 + SQLite (dev) عبر `@prisma/adapter-better-sqlite3` |
| Theme | next-themes (light/dark wood palette) |
| Notifications | sonner toaster |
| Charts | Recharts |
| Tables | TanStack Table v8 |

---

## 🚀 البدء السريع

### المتطلبات
- Node.js **20.9+** (Next 16 شرط)
- npm 10+

### الإعداد

```bash
# 1. ثبّت الـ dependencies
npm install

# 2. شغّل الـ migration وأنشئ DB
npm run db:migrate

# 3. عبّي البيانات الأولية (مستخدمين تجريبيين)
npm run db:seed

# 4. شغّل الخادم
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) — سيُحوَّل تلقائياً إلى `/ar/dashboard`.

### حسابات تجريبية بعد الـ seed

| الحساب | كلمة المرور | الدور |
|---|---|---|
| `admin@palacewood.sa` | `admin123` | المدير العام |
| `ops@palacewood.sa` | `admin123` | مدير العمليات |
| `cs@palacewood.sa` | `admin123` | خدمة العملاء |

---

## 📁 هيكل المشروع

```
palace-wood-factory/
├── prisma/
│   ├── schema.prisma          # الـ schema الكامل (User, Customer, Order, …)
│   ├── migrations/            # ملفات الـ migrations
│   └── seed.ts                # بيانات أولية
├── src/
│   ├── app/
│   │   └── [locale]/          # كل الصفحات تحت locale segment
│   │       ├── layout.tsx     # Root layout (html, dir, providers)
│   │       ├── page.tsx       # redirect → /dashboard
│   │       ├── (auth)/
│   │       │   └── login/
│   │       └── (dashboard)/
│   │           ├── layout.tsx # auth gate + sidebar/header
│   │           └── dashboard/
│   ├── components/
│   │   ├── ui/                # button, card, input, label, badge
│   │   ├── layout/            # sidebar, header
│   │   └── providers/         # theme, session
│   ├── i18n/
│   │   ├── routing.ts         # locales config
│   │   ├── request.ts         # server-side i18n bootstrap
│   │   └── navigation.ts      # locale-aware Link/redirect
│   ├── messages/
│   │   ├── ar.json            # ترجمات عربية
│   │   └── en.json            # ترجمات إنجليزية
│   ├── lib/
│   │   ├── db.ts              # Prisma client (better-sqlite3 adapter)
│   │   ├── utils.ts           # cn(), formatCurrency, normalizeSaudiPhone
│   │   └── validations/       # Zod schemas
│   ├── auth.config.ts         # config slim للـ proxy
│   ├── auth.ts                # NextAuth full (DB + bcrypt)
│   ├── proxy.ts               # ⚡ Next 16 middleware (formerly middleware.ts)
│   └── types/
│       └── next-auth.d.ts     # تمديد session.user.role
├── next.config.ts             # withNextIntl(...)
└── prisma.config.ts           # DATABASE_URL via dotenv
```

> **ملاحظة Next 16:** كل APIs الديناميكية (`params`, `searchParams`, `cookies`, `headers`)
> أصبحت **async**. الـ middleware القديم اسمه الجديد `proxy.ts`.

---

## 🎨 نظام التصميم

ألوان wood-themed مُعرَّفة في `src/app/globals.css` كـ CSS variables:

| Token | Light | Dark |
|---|---|---|
| `primary` | `#2c1810` (wood-800) | `#d4a017` (gold) |
| `accent` | `#b8860b` (gold) | `#d4a017` |
| `background` | `#faf3e7` (cream) | `#1a0e07` (dark wood) |

استعمل في الـ components كذا:
```tsx
<div className="bg-primary text-primary-foreground">…</div>
<div className="bg-wood-200 text-wood-900">…</div>
```

الخطوط:
- **Cairo** للعربية (auto-loaded في `[locale]/layout.tsx`)
- **Inter** للإنجليزية
- **Playfair Display** للعناوين الديكورية

---

## 🧰 الأوامر

| الأمر | يعمل |
|---|---|
| `npm run dev` | يشغّل dev server (Turbopack) |
| `npm run build` | بناء production |
| `npm run start` | تشغيل production build |
| `npm run lint` | فحص ESLint |
| `npm run db:migrate` | إنشاء/تطبيق migration |
| `npm run db:generate` | توليد Prisma client |
| `npm run db:studio` | فتح Prisma Studio |
| `npm run db:seed` | حقن البيانات الأولية |
| `npm run db:reset` | حذف DB + إعادة الـ migrations + seed |

---

## 🔐 المصادقة (NextAuth v5)

- **Provider**: Credentials (email + password)
- **Session strategy**: JWT
- **هاش كلمة السر**: bcryptjs (10 rounds)
- **Auth gate**: في `auth.config.ts` callback `authorized` + متكامل مع `proxy.ts`

أدوار المستخدم (موجودة كـ String في الـ DB، يتم التحقق منها بـ Zod):
- `ADMIN` — صلاحية كاملة
- `OPERATIONS_MANAGER` — إدارة الطلبات والعملاء
- `CUSTOMER_SERVICE` — استقبال الطلبات
- `DESIGNER` — مراجعة التصاميم
- `PRODUCTION_SUPERVISOR` — تحديث مراحل الإنتاج
- `WAREHOUSE_KEEPER` — إدارة المخزون
- `TECHNICIAN` — طلبات الصيانة

---

## 🌐 الـ i18n

- اللغات: `ar` (افتراضي) + `en`
- اتجاه الواجهة يتغيّر تلقائياً (`dir="rtl"` / `dir="ltr"`)
- كل النصوص في `src/messages/{locale}.json`
- التنقّل: استورد من `@/i18n/navigation` بدل `next/link`:

```tsx
import { Link, redirect, useRouter } from "@/i18n/navigation";
```

تبديل اللغة: زر في الـ header يحوّل `/ar/...` ↔ `/en/...`.

---

## 🗄️ قاعدة البيانات (SQLite للتطوير)

تكييفات SQLite:
- **enums** → حقول `String` + Zod validators
- **`Decimal`** → `Float` (دقة كافية للريال السعودي في dev)
- **`@db.Text`** غير ضروري (SQLite TEXT بلا حد)

للترقية لـ PostgreSQL (production):
1. غيّر `provider = "postgresql"` في `prisma/schema.prisma`
2. حدّث `DATABASE_URL` في `.env`
3. ثبّت `@prisma/adapter-pg` بدلاً من `better-sqlite3`
4. عدّل `src/lib/db.ts` للاستخدام الجديد
5. رجّع enums حقيقية إذا تبي

الموديلات (16 جدول):
`User`, `Account`, `Session`, `Customer`, `Product`, `ProductImage`,
`Order`, `OrderFile`, `OrderStage`, `Complaint`, `ComplaintAttachment`,
`ComplaintResponse`, `MaintenanceRequest`, `MaintenancePhoto`, `Material`,
`StockMovement`, `OrderMaterial`, `Supplier`, `PurchaseOrder`,
`PurchaseOrderItem`, `Payment`, `Notification`, `AuditLog`, `Setting`.

---

## 📦 الوحدات (خارطة المراحل)

- ✅ **المرحلة 1**: المنصة (Auth + i18n + Layout + Dashboard skeleton) — **هنا**
- ⏳ **المرحلة 2**: إدارة العملاء (CRUD + بحث + Excel)
- ⏳ **المرحلة 3**: إدارة الطلبات (Multi-step form + 5 مراحل + ملفات)
- ⏳ **المرحلة 4**: الشكاوى (Kanban) + الصيانة (Calendar + توقيع)
- ⏳ **المرحلة 5**: المخزون + المدفوعات
- ⏳ **المرحلة 6**: التقارير + الإشعارات + WhatsApp integration

---

## 📞 معلومات المصنع

- الاسم: مصنع أخشاب القصور للأعمال الخشبية
- التأسيس: 2009
- الفروع: فرع واحد (المملكة العربية السعودية)
- التخصص: أبواب — أثاث مخصص — ديكورات داخلية
- العملة: ر.س (SAR)

---

## ⚠️ ملاحظات للنشر (Production)

قبل الـ deploy:

1. غيّر `AUTH_SECRET` في `.env` لقيمة عشوائية قوية (`openssl rand -base64 32`)
2. حدّث `AUTH_URL` لدومين الإنتاج
3. اقفل `WHATSAPP_MOCK_MODE` ووصّل WhatsApp Business API الفعلي
4. ارفع DB من SQLite إلى PostgreSQL
5. فعّل Cache Components (`cacheComponents: true` في `next.config.ts`) للأداء الأفضل
6. اضبط CSP headers
