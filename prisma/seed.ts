import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding…");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@palacewood.sa" },
    update: {},
    create: {
      email: "admin@palacewood.sa",
      name: "المدير العام",
      role: "ADMIN",
      passwordHash,
      isActive: true,
    },
  });

  const ops = await prisma.user.upsert({
    where: { email: "ops@palacewood.sa" },
    update: {},
    create: {
      email: "ops@palacewood.sa",
      name: "أحمد العتيبي",
      role: "OPERATIONS_MANAGER",
      passwordHash,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "cs@palacewood.sa" },
    update: {},
    create: {
      email: "cs@palacewood.sa",
      name: "سارة الحربي",
      role: "CUSTOMER_SERVICE",
      passwordHash,
      isActive: true,
    },
  });

  console.log("✅ Users:", admin.email, ops.email);

  // Settings
  await prisma.setting.upsert({
    where: { key: "factory_name_ar" },
    update: {},
    create: { key: "factory_name_ar", value: "مصنع أخشاب القصور", category: "factory" },
  });
  await prisma.setting.upsert({
    where: { key: "factory_name_en" },
    update: {},
    create: { key: "factory_name_en", value: "Palace Wood Factory", category: "factory" },
  });

  console.log("✅ Settings seeded");

  // ============================================================
  // Customers (15 realistic Saudi records)
  // ============================================================
  const year = new Date().getFullYear();
  const customers = [
    {
      fullName: "محمد عبدالله الشمري",
      phone: "+966501112233",
      whatsapp: "+966501112233",
      city: "الرياض",
      district: "حي العليا",
      source: "INSTAGRAM",
      isVip: true,
      customerType: "INDIVIDUAL",
      email: "m.shamri@example.com",
    },
    {
      fullName: "فهد سعد القحطاني",
      phone: "+966502223344",
      city: "الرياض",
      district: "حي النرجس",
      source: "REFERRAL",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "نورة بنت سلطان",
      phone: "+966503334455",
      whatsapp: "+966503334455",
      city: "جدة",
      district: "حي الروضة",
      source: "WHATSAPP",
      isVip: true,
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "شركة الإعمار للمقاولات",
      phone: "+966504445566",
      email: "info@emaar-contracting.sa",
      city: "الرياض",
      district: "حي الملقا",
      source: "GOOGLE",
      customerType: "COMPANY",
      companyName: "شركة الإعمار للمقاولات",
      isVip: true,
      notes: "عميل ذهبي — يطلب أبواب رئيسية بكميات كبيرة",
    },
    {
      fullName: "عبدالعزيز إبراهيم العمري",
      phone: "+966505556677",
      city: "الدمام",
      district: "حي الفيصلية",
      source: "WALK_IN",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "ريم محمد الزهراني",
      phone: "+966506667788",
      whatsapp: "+966506667788",
      city: "جدة",
      source: "INSTAGRAM",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "خالد ناصر السبيعي",
      phone: "+966507778899",
      city: "الرياض",
      district: "حي الياسمين",
      source: "REFERRAL",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "مكتب التصميم الحديث",
      phone: "+966508889900",
      email: "design@modern.sa",
      city: "الرياض",
      district: "حي السليمانية",
      source: "GOOGLE",
      customerType: "COMPANY",
      companyName: "مكتب التصميم الحديث للهندسة",
    },
    {
      fullName: "هند عبدالرحمن الدوسري",
      phone: "+966509990011",
      city: "الخبر",
      source: "WHATSAPP",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "ماجد علي الغامدي",
      phone: "+966551112233",
      city: "الطائف",
      source: "WALK_IN",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "لطيفة سعيد الحربي",
      phone: "+966552223344",
      whatsapp: "+966552223344",
      city: "المدينة المنورة",
      source: "INSTAGRAM",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "بدر فيصل المطيري",
      phone: "+966553334455",
      city: "بريدة",
      district: "حي الصفراء",
      source: "REFERRAL",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "شركة الفخامة للديكور",
      phone: "+966554445566",
      email: "contact@fakhama-decor.com",
      city: "الرياض",
      source: "GOOGLE",
      customerType: "COMPANY",
      companyName: "شركة الفخامة للديكور المحدودة",
      isVip: true,
    },
    {
      fullName: "سارة أحمد الخالدي",
      phone: "+966555556677",
      city: "أبها",
      source: "OTHER",
      customerType: "INDIVIDUAL",
    },
    {
      fullName: "تركي محمد العنزي",
      phone: "+966556667788",
      whatsapp: "+966556667788",
      city: "حائل",
      district: "حي العليا",
      source: "WHATSAPP",
      customerType: "INDIVIDUAL",
      notes: "يفضل التواصل مساءً بعد العصر",
    },
  ];

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const code = `CUS-${year}-${String(i + 1).padStart(3, "0")}`;
    await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        customerCode: code,
        fullName: c.fullName,
        phone: c.phone,
        whatsapp: c.whatsapp ?? null,
        email: c.email ?? null,
        city: c.city,
        district: c.district ?? null,
        customerType: c.customerType,
        companyName: c.companyName ?? null,
        source: c.source,
        isVip: c.isVip ?? false,
        notes: c.notes ?? null,
      },
    });
  }
  console.log(`✅ ${customers.length} customers seeded`);

  console.log("\n🎉 Seed complete!");
  console.log("\n👉 Login credentials:");
  console.log("   admin@palacewood.sa / admin123  (Admin)");
  console.log("   ops@palacewood.sa   / admin123  (Operations)");
  console.log("   cs@palacewood.sa    / admin123  (Customer Service)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
