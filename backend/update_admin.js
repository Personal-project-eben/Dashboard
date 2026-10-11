import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.updateMany({
    where: { 
      email: { in: ['kloboebenezer@gmail.com', 'ben@epitech.bj'] }
    },
    data: { isAdmin: true },
  })
  console.log('Updated existing users to admin')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
