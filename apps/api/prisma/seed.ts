import { hash } from "@node-rs/argon2";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const requiredSeedValue = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before running the admin seed.`);
  }

  return value;
};

const requiredAdminEmail = () => {
  const email = requiredSeedValue("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const parsedEmail = z.string().email().safeParse(email);

  if (!parsedEmail.success) {
    throw new Error("SEED_ADMIN_EMAIL must contain a valid email address.");
  }

  return parsedEmail.data;
};

const main = async () => {
  const adminEmail = requiredAdminEmail();
  const adminPasswordHash = await hash(requiredSeedValue("SEED_ADMIN_PASSWORD"), { algorithm: 2 });

  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { name: "GestCon Admin", passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
  } else {
    await prisma.user.create({
      data: { name: "GestCon Admin", email: adminEmail, passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
  }

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
