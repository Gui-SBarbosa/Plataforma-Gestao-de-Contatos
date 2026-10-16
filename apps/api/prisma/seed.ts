import { hash } from "@node-rs/argon2";
import { ContactSource, PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

import { passwordSchema } from "../src/shared/password-policy.js";

const prisma = new PrismaClient();
const resetRequested = process.argv.includes("--reset");

const requiredSeedValue = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before running the demo seed.`);
  }

  return value;
};

const requiredSeedEmail = (name: string) => {
  const email = requiredSeedValue(name).trim().toLowerCase();
  const parsedEmail = z.string().email().safeParse(email);

  if (!parsedEmail.success) {
    throw new Error(`${name} must contain a valid email address.`);
  }

  return parsedEmail.data;
};

const requiredSeedPassword = (name: string) => {
  const password = requiredSeedValue(name);
  const parsedPassword = passwordSchema.safeParse(password);

  if (!parsedPassword.success) {
    throw new Error(`${name} does not meet the password policy.`);
  }

  return parsedPassword.data;
};

const operatorEmails = ["guilherme.barbosa@gestcon.demo", "mariana.oliveira@gestcon.demo"];

const demoContacts = [
  ["demo-operador-um-01", "Mariana Costa", "mariana.costa@example.com", "11987654321", "Aurora Studio", "São Paulo", ContactSource.WEBSITE],
  ["demo-operador-um-02", "Rafael Mendes", "rafael.mendes@example.com", "11976543210", "Nexa Solutions", "São Paulo", ContactSource.REFERRAL],
  ["demo-operador-um-03", "Beatriz Lima", "beatriz.lima@example.com", "11965432109", "Viva Saúde", "Campinas", ContactSource.SOCIAL_MEDIA],
  ["demo-operador-um-04", "Lucas Ribeiro", "lucas.ribeiro@example.com", "11954321098", "Ponto Forte", "Santos", ContactSource.PHONE],
  ["demo-operador-um-05", "Carolina Alves", "carolina.alves@example.com", "11943210987", "Lume Arquitetura", "São Paulo", ContactSource.WEBSITE],
  ["demo-operador-um-06", "Diego Martins", "diego.martins@example.com", "11932109876", "Orbe Digital", "Guarulhos", ContactSource.OTHER],
  ["demo-operador-um-07", "Elisa Moreira", "elisa.moreira@example.com", "11921098765", "Vértice Engenharia", "Osasco", ContactSource.REFERRAL],
  ["demo-operador-um-08", "Felipe Cardoso", "felipe.cardoso@example.com", "11910987654", "Aquarela Foods", "São Paulo", ContactSource.PHONE],
  ["demo-operador-um-09", "Gabriela Torres", "gabriela.torres@example.com", "11899876543", "Pilar Contábil", "Santo André", ContactSource.SOCIAL_MEDIA],
  ["demo-operador-um-10", "Henrique Castro", "henrique.castro@example.com", "11888765432", "Planalto Tech", "Barueri", ContactSource.WEBSITE],
  ["demo-operador-um-11", "Isabela Duarte", "isabela.duarte@example.com", "11877654321", "Ritmo Moda", "São Paulo", ContactSource.OTHER],
  ["demo-operador-um-12", "João Vieira", "joao.vieira@example.com", "11866543210", "Horizonte Móveis", "Mauá", ContactSource.REFERRAL],
  ["demo-operadora-dois-01", "Fernanda Rocha", "fernanda.rocha@example.com", "21987654321", "Atlântica Comércio", "Rio de Janeiro", ContactSource.REFERRAL],
  ["demo-operadora-dois-02", "Gustavo Nunes", "gustavo.nunes@example.com", "21976543210", "Ciclo Verde", "Niterói", ContactSource.WEBSITE],
  ["demo-operadora-dois-03", "Helena Barros", "helena.barros@example.com", "21965432109", "Casa Nova", "Rio de Janeiro", ContactSource.SOCIAL_MEDIA],
  ["demo-operadora-dois-04", "Igor Freitas", "igor.freitas@example.com", "21954321098", "Rota Logística", "Duque de Caxias", ContactSource.PHONE],
  ["demo-operadora-dois-05", "Juliana Teixeira", "juliana.teixeira@example.com", "21943210987", "Brisa Eventos", "Rio de Janeiro", ContactSource.OTHER],
  ["demo-operadora-dois-06", "Kaique Santos", "kaique.santos@example.com", "21932109876", "Mosaico Design", "São Gonçalo", ContactSource.WEBSITE],
  ["demo-operadora-dois-07", "Larissa Neves", "larissa.neves@example.com", "21821098765", "Cais Criativo", "Rio de Janeiro", ContactSource.SOCIAL_MEDIA],
  ["demo-operadora-dois-08", "Marcelo Pires", "marcelo.pires@example.com", "21810987654", "Vento Sul", "Nova Iguaçu", ContactSource.PHONE],
  ["demo-operadora-dois-09", "Natália Melo", "natalia.melo@example.com", "21799876543", "Caderno Vivo", "Rio de Janeiro", ContactSource.WEBSITE],
  ["demo-operadora-dois-10", "Otávio Braga", "otavio.braga@example.com", "21788765432", "Fio Forte", "Petrópolis", ContactSource.REFERRAL],
  ["demo-operadora-dois-11", "Patrícia Azevedo", "patricia.azevedo@example.com", "21777654321", "Sereno Café", "Niterói", ContactSource.OTHER],
  ["demo-operadora-dois-12", "Rogério Ramos", "rogerio.ramos@example.com", "21766543210", "Metrópole RH", "Rio de Janeiro", ContactSource.SOCIAL_MEDIA],
] as const;

const hasPersistedData = async () => {
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.contact.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.session.count(),
    prisma.rateLimitBucket.count(),
  ]);

  return counts.some((count) => count > 0);
};

const clearDatabase = async () => {
  await prisma.$transaction([
    prisma.rateLimitBucket.deleteMany(),
    prisma.session.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

const main = async () => {
  if (resetRequested) {
    await clearDatabase();
  } else if (await hasPersistedData()) {
    console.info("Demo seed skipped because the database already contains data.");
    return;
  }

  const adminEmail = requiredSeedEmail("SEED_ADMIN_EMAIL");
  const adminPassword = requiredSeedPassword("SEED_ADMIN_PASSWORD");
  const operatorPassword = requiredSeedPassword("SEED_OPERATOR_PASSWORD");
  const [adminPasswordHash, operatorOnePasswordHash, operatorTwoPasswordHash] = await Promise.all([
    hash(adminPassword, { algorithm: 2 }),
    hash(operatorPassword, { algorithm: 2 }),
    hash(operatorPassword, { algorithm: 2 }),
  ]);

  const [admin, operatorOne, operatorTwo] = await prisma.$transaction([
    prisma.user.create({
      data: { name: "Administrador GestCon", email: adminEmail, passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { name: "Guilherme Barbosa", email: operatorEmails[0], passwordHash: operatorOnePasswordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { name: "Mariana Oliveira", email: operatorEmails[1], passwordHash: operatorTwoPasswordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
    }),
  ]);

  await prisma.contact.createMany({
    data: demoContacts.map(([seedKey, name, email, phone, company, city, source], index) => ({
      seedKey,
      name,
      email,
      phone,
      company,
      city,
      source,
      createdById: index < demoContacts.length / 2 ? operatorOne.id : operatorTwo.id,
    })),
  });

  console.info(`Demo seed completed with ${admin.name}, 2 operators, and ${demoContacts.length} contacts.`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
