import { hash } from "@node-rs/argon2";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const requiredSeedPassword = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before running the admin seed.`);
  }

  return value;
};

const main = async () => {
  const adminPasswordHash = await hash(requiredSeedPassword("SEED_ADMIN_PASSWORD"), { algorithm: 2 });

  await prisma.user.upsert({
    where: { email: "admin.demo@example.com" },
    update: { name: "GestCon Admin", passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: { name: "GestCon Admin", email: "admin.demo@example.com", passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
  });

  console.info("Seeded the demo administrator.");
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
