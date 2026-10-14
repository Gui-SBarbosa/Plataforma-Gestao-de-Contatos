import { hash } from "@node-rs/argon2";
import { PrismaClient, ContactSource, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const requiredSeedPassword = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before running the demo seed.`);
  }

  return value;
};

const contacts = [
  ["Ana Souza", "ana.souza@example.com", "+55 11 99999-0001", "Alvorada Tech", "São Paulo", ContactSource.WEBSITE],
  ["Bruno Lima", "bruno.lima@example.com", "+55 21 99999-0002", "Norte Digital", "Rio de Janeiro", ContactSource.REFERRAL],
  ["Carla Mendes", "carla.mendes@example.com", "+55 31 99999-0003", "Horizonte Saúde", "Belo Horizonte", ContactSource.SOCIAL_MEDIA],
  ["Diego Alves", "diego.alves@example.com", "+55 41 99999-0004", "Paraná Log", "Curitiba", ContactSource.PHONE],
  ["Elisa Rocha", "elisa.rocha@example.com", "+55 51 99999-0005", "Sul Consultoria", "Porto Alegre", ContactSource.OTHER],
  ["Fábio Costa", "fabio.costa@example.com", "+55 61 99999-0006", "Cerrado Foods", "Brasília", ContactSource.WEBSITE],
  ["Gabriela Nunes", "gabriela.nunes@example.com", "+55 71 99999-0007", "Bahia Criativa", "Salvador", ContactSource.REFERRAL],
  ["Henrique Dias", "henrique.dias@example.com", "+55 81 99999-0008", "Maré Serviços", "Recife", ContactSource.SOCIAL_MEDIA],
  ["Isabela Martins", "isabela.martins@example.com", "+55 85 99999-0009", "Fortaleza Hub", "Fortaleza", ContactSource.PHONE],
  ["João Freitas", "joao.freitas@example.com", "+55 62 99999-0010", "Centro Oeste", "Goiânia", ContactSource.OTHER],
  ["Karina Lopes", "karina.lopes@example.com", "+55 27 99999-0011", "Capixaba Design", "Vitória", ContactSource.WEBSITE],
  ["Lucas Teixeira", "lucas.teixeira@example.com", "+55 92 99999-0012", "Amazônia Verde", "Manaus", ContactSource.REFERRAL],
  ["Mariana Pinto", "mariana.pinto@example.com", "+55 91 99999-0013", "Norte Energia", "Belém", ContactSource.SOCIAL_MEDIA],
  ["Nicolas Ramos", "nicolas.ramos@example.com", "+55 48 99999-0014", "Ilha Sistemas", "Florianópolis", ContactSource.PHONE],
  ["Olívia Castro", "olivia.castro@example.com", "+55 67 99999-0015", "Pantanal Turismo", "Campo Grande", ContactSource.OTHER],
  ["Paulo Tavares", "paulo.tavares@example.com", "+55 65 99999-0016", "Mato Grosso Agro", "Cuiabá", ContactSource.WEBSITE],
  ["Queila Barros", "queila.barros@example.com", "+55 98 99999-0017", "Maranhão Arte", "São Luís", ContactSource.REFERRAL],
  ["Rafael Moura", "rafael.moura@example.com", "+55 86 99999-0018", "Piauí Labs", "Teresina", ContactSource.SOCIAL_MEDIA],
  ["Sara Gomes", "sara.gomes@example.com", "+55 83 99999-0019", "Paraíba Saúde", "João Pessoa", ContactSource.PHONE],
  ["Tiago Reis", "tiago.reis@example.com", "+55 79 99999-0020", "Sergipe Office", "Aracaju", ContactSource.OTHER],
  ["Úrsula Vieira", "ursula.vieira@example.com", "+55 82 99999-0021", "Alagoas Mar", "Maceió", ContactSource.WEBSITE],
  ["Victor Neves", "victor.neves@example.com", "+55 69 99999-0022", "Rondônia Forte", "Porto Velho", ContactSource.REFERRAL],
  ["Wagner Melo", "wagner.melo@example.com", "+55 95 99999-0023", "Roraima Norte", "Boa Vista", ContactSource.SOCIAL_MEDIA],
  ["Yasmin Duarte", "yasmin.duarte@example.com", "+55 63 99999-0024", "Tocantins Sol", "Palmas", ContactSource.PHONE],
] as const;

const main = async () => {
  const adminPasswordHash = await hash(requiredSeedPassword("SEED_ADMIN_PASSWORD"), { algorithm: 2 });
  const operatorPasswordHash = await hash(requiredSeedPassword("SEED_OPERATOR_PASSWORD"), { algorithm: 2 });

  const admin = await prisma.user.upsert({
    where: { email: "admin.demo@example.com" },
    update: { name: "GestCon Admin", passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: { name: "GestCon Admin", email: "admin.demo@example.com", passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator.demo@example.com" },
    update: { name: "GestCon Operator", passwordHash: operatorPasswordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
    create: { name: "GestCon Operator", email: "operator.demo@example.com", passwordHash: operatorPasswordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE, approvedAt: new Date(), approvedById: admin.id },
  });

  for (const [index, [name, email, phone, company, city, source]] of contacts.entries()) {
    await prisma.contact.upsert({
      where: { seedKey: `demo-contact-${index + 1}` },
      update: { name, email, phone, company, city, source, createdById: operator.id },
      create: { seedKey: `demo-contact-${index + 1}`, name, email, phone, company, city, source, createdById: operator.id },
    });
  }

  console.info(`Seeded ${contacts.length} contacts and demo users.`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
