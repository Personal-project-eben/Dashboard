import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/password.js'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log("Current users:", users)

  // Créons un admin dédié au cas où
  const adminEmail = 'admin@admin.com'
  
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } })
  
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashPassword('admin1234'),
        confirmed: true,
        isAdmin: true
      }
    })
    console.log("Created new admin:", adminEmail)
  } else if (!admin.isAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true, confirmed: true }
    })
    console.log("Updated admin@admin.com to isAdmin=true")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
