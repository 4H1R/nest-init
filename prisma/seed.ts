import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const user = async () => ({
  name: faker.name.findName(),
  email: faker.unique(faker.internet.email).toLowerCase(),
  password: await bcrypt.hash('password', 10),
});

const generateFakeData = async <T>(func: () => Promise<T>, count = 50) => {
  return await Promise.all(Array(count).fill(null).map(func));
};

async function main() {
  const usersData = await generateFakeData(user);
  await prisma.user.createMany({ data: usersData });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });