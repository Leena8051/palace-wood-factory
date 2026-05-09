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
