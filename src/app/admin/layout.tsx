import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await requireAuthUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { email: true },
  })

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail || dbUser?.email !== adminEmail) {
    redirect('/')
  }

  return <>{children}</>
}
