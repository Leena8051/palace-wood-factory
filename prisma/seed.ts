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

  // ============================================================
  // Orders (8 orders in mixed stages)
  // ============================================================
  const allCustomers = await prisma.customer.findMany({ select: { id: true, phone: true } });
  const cByPhone = new Map(allCustomers.map((c) => [c.phone, c.id]));

  type StageStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  type OrderSeed = {
    customerPhone: string;
    productCategory: "DOORS" | "FURNITURE" | "INTERIOR_DECOR";
    productType: string;
    description: string;
    width?: number; height?: number; depth?: number;
    woodType?: string; color?: string; finishType?: string;
    estimatedPrice: number;
    deposit?: number;
    paidAmount?: number;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    status: "DESIGN" | "APPROVED" | "PRODUCTION" | "FINISHING" | "READY" | "DELIVERED";
    currentStage: number;
    /** stage statuses 1..5 */
    stages: StageStatus[];
  };

  const orderSeeds: OrderSeed[] = [
    {
      customerPhone: "+966504445566", // شركة الإعمار
      productCategory: "DOORS",
      productType: "أبواب رئيسية فاخرة - مجمع سكني",
      description:
        "12 باب رئيسي خشب زان طبيعي بمقاسات قياسية، مع مقابض ذهبية وحفر يدوي على الإطار العلوي.",
      width: 100, height: 220, depth: 5,
      woodType: "زان", color: "بني داكن", finishType: "لاكيه لامع",
      estimatedPrice: 48000, deposit: 20000, paidAmount: 20000,
      priority: "HIGH", status: "PRODUCTION", currentStage: 3,
      stages: ["COMPLETED", "COMPLETED", "IN_PROGRESS", "PENDING", "PENDING"],
    },
    {
      customerPhone: "+966501112233", // محمد الشمري VIP
      productCategory: "FURNITURE",
      productType: "غرفة نوم رئيسية كاملة",
      description:
        "غرفة نوم خشب MDF لاكيه أبيض مع تطعيمات ذهبية، تشمل سرير + 2 كمدينو + تسريحة + دولاب 6 أبواب.",
      width: 200, height: 240, depth: 60,
      woodType: "MDF لاكيه", color: "أبيض كريمي", finishType: "لاكيه مطفي",
      estimatedPrice: 22500, deposit: 10000, paidAmount: 10000,
      priority: "NORMAL", status: "FINISHING", currentStage: 4,
      stages: ["COMPLETED", "COMPLETED", "COMPLETED", "IN_PROGRESS", "PENDING"],
    },
    {
      customerPhone: "+966503334455", // نورة بنت سلطان VIP
      productCategory: "INTERIOR_DECOR",
      productType: "كسوة جدران مدخل ودرج",
      description: "تكسية جدران المدخل والدرج بألواح خشب جوز طبيعي مع لمبات إضاءة.",
      width: 600, height: 350,
      woodType: "خشب الجوز", color: "بني محمر طبيعي", finishType: "ورنيش",
      estimatedPrice: 18000, deposit: 9000, paidAmount: 9000,
      priority: "NORMAL", status: "READY", currentStage: 5,
      stages: ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "IN_PROGRESS"],
    },
    {
      customerPhone: "+966502223344", // فهد القحطاني
      productCategory: "DOORS",
      productType: "باب فيلا رئيسي",
      description: "باب رئيسي فردي خشب سنديان مع زجاج مزخرف.",
      width: 110, height: 230, depth: 6,
      woodType: "سنديان (بلوط)", finishType: "لاكيه لامع",
      estimatedPrice: 8500,
      priority: "NORMAL", status: "DESIGN", currentStage: 1,
      stages: ["IN_PROGRESS", "PENDING", "PENDING", "PENDING", "PENDING"],
    },
    {
      customerPhone: "+966554445566", // الفخامة للديكور
      productCategory: "FURNITURE",
      productType: "مجلس عربي مفصّل",
      description:
        "مجلس عربي خشب طبيعي مع نقوش يدوية، يشمل كنبات أرضية وطاولات قهوة وستارة خشبية.",
      width: 800, height: 90, depth: 100,
      woodType: "خشب طبيعي مستورد", color: "بني عسلي", finishType: "ورنيش",
      estimatedPrice: 65000, deposit: 30000, paidAmount: 30000,
      priority: "URGENT", status: "PRODUCTION", currentStage: 2,
      stages: ["COMPLETED", "IN_PROGRESS", "PENDING", "PENDING", "PENDING"],
    },
    {
      customerPhone: "+966506667788", // ريم الزهراني
      productCategory: "INTERIOR_DECOR",
      productType: "خزانة مطبخ مدمجة",
      description: "خزانة مطبخ علوية وسفلية MDF مع رخام جانبي.",
      width: 320, height: 240, depth: 60,
      woodType: "MDF", color: "رمادي فاتح", finishType: "لاكيه مطفي",
      estimatedPrice: 14500, deposit: 5000, paidAmount: 14500,
      priority: "NORMAL", status: "DELIVERED", currentStage: 5,
      stages: ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED"],
    },
    {
      customerPhone: "+966552223344", // لطيفة الحربي
      productCategory: "DOORS",
      productType: "أبواب غرف داخلية (5 أبواب)",
      description: "5 أبواب غرف خشب زان مع جلد على الجوانب.",
      width: 90, height: 220, depth: 4,
      woodType: "زان", color: "بني فاتح", finishType: "لاكيه مطفي",
      estimatedPrice: 11000, deposit: 5000, paidAmount: 5000,
      priority: "NORMAL", status: "APPROVED", currentStage: 2,
      stages: ["COMPLETED", "PENDING", "PENDING", "PENDING", "PENDING"],
    },
    {
      customerPhone: "+966553334455", // بدر المطيري
      productCategory: "FURNITURE",
      productType: "مكتب تنفيذي + كرسي",
      description: "مكتب تنفيذي مع رفوف خلفية وكرسي مدير من نفس الخشب.",
      width: 200, height: 80, depth: 90,
      woodType: "ماهوجني", color: "بني داكن", finishType: "ورنيش",
      estimatedPrice: 9500,
      priority: "LOW", status: "DESIGN", currentStage: 1,
      stages: ["IN_PROGRESS", "PENDING", "PENDING", "PENDING", "PENDING"],
    },
  ];

  // Find admin user for createdBy
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@palacewood.sa" },
    select: { id: true },
  });
  if (!adminUser) throw new Error("Admin user not found — run user seed first");

  const stageNames = ["DESIGN", "CUTTING", "ASSEMBLY", "FINISHING", "DELIVERY"];

  // Wipe existing seeded orders so re-running seed is idempotent
  const existingOrderCount = await prisma.order.count();
  if (existingOrderCount === 0) {
    for (let i = 0; i < orderSeeds.length; i++) {
      const o = orderSeeds[i];
      const customerId = cByPhone.get(o.customerPhone);
      if (!customerId) continue;

      const orderNumber = `ORD-${year}-${String(i + 1).padStart(4, "0")}`;
      const now = new Date();
      const createdAt = new Date(now.getTime() - (orderSeeds.length - i) * 86400000 * 3);

      await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          productCategory: o.productCategory,
          productType: o.productType,
          description: o.description,
          width: o.width, height: o.height, depth: o.depth,
          woodType: o.woodType ?? null,
          color: o.color ?? null,
          finishType: o.finishType ?? null,
          status: o.status,
          currentStage: o.currentStage,
          priority: o.priority,
          estimatedPrice: o.estimatedPrice,
          deposit: o.deposit ?? null,
          paidAmount: o.paidAmount ?? 0,
          createdById: adminUser.id,
          createdAt,
          updatedAt: createdAt,
          stages: {
            create: stageNames.map((name, idx) => ({
              stageNumber: idx + 1,
              stageName: name,
              status: o.stages[idx],
              startedAt:
                o.stages[idx] === "IN_PROGRESS" || o.stages[idx] === "COMPLETED"
                  ? new Date(createdAt.getTime() + idx * 86400000)
                  : null,
              completedAt:
                o.stages[idx] === "COMPLETED"
                  ? new Date(createdAt.getTime() + (idx + 1) * 86400000)
                  : null,
              updatedById: adminUser.id,
            })),
          },
        },
      });
    }
    console.log(`✅ ${orderSeeds.length} orders seeded`);
  } else {
    console.log(`ℹ️  Orders already exist (${existingOrderCount}) — skipped`);
  }

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
