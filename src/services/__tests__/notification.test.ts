import { describe, it, expect } from 'vitest'
import { prismaMock } from './prisma.mock'
import { getNotifications, markAsRead, markAllAsRead } from '../notification.service'

const USER_ID = 'user-uuid'

describe('getNotifications', () => {
  it('returns notifications with unread count', async () => {
    const mockNotifications = [
      {
        id: 'n1',
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        body: 'Your booking BK-001 has been confirmed.',
        data: { bookingId: 'b1' },
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-03-27'),
      },
      {
        id: 'n2',
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        body: 'Booking BK-002 has been cancelled.',
        data: null,
        isRead: true,
        readAt: new Date('2026-03-26'),
        createdAt: new Date('2026-03-26'),
      },
    ]

    prismaMock.notification.findMany.mockResolvedValue(mockNotifications)
    prismaMock.notification.count.mockResolvedValue(1)

    const result = await getNotifications(USER_ID)

    expect(result.notifications).toHaveLength(2)
    expect(result.unreadCount).toBe(1)
    expect(result.notifications[0].title).toBe('Booking Confirmed')
  })

  it('passes cursor for pagination', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.count.mockResolvedValue(0)

    await getNotifications(USER_ID, { cursor: 'cursor-id' })

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        cursor: { id: 'cursor-id' },
      })
    )
  })

  it('uses default limit of 20', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.count.mockResolvedValue(0)

    await getNotifications(USER_ID)

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 })
    )
  })

  it('respects custom limit', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.count.mockResolvedValue(0)

    await getNotifications(USER_ID, { limit: 5 })

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })

  it('queries in descending createdAt order', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.count.mockResolvedValue(0)

    await getNotifications(USER_ID)

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })
})

describe('markAsRead', () => {
  it('updates only unread notification owned by user', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 })

    await markAsRead(USER_ID, 'notif-id')

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-id', userId: USER_ID, isRead: false },
      data: { isRead: true, readAt: expect.any(Date) },
    })
  })

  it('is a no-op for already-read notification', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })

    await markAsRead(USER_ID, 'already-read-id')

    // Still calls updateMany but matches 0 rows — no error, no side effect
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'already-read-id', userId: USER_ID, isRead: false },
      data: { isRead: true, readAt: expect.any(Date) },
    })
  })
})

describe('markAllAsRead', () => {
  it('marks all unread notifications and returns count', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 5 })

    const count = await markAllAsRead(USER_ID)

    expect(count).toBe(5)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, isRead: false },
      data: { isRead: true, readAt: expect.any(Date) },
    })
  })

  it('returns 0 when no unread notifications', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })

    const count = await markAllAsRead(USER_ID)
    expect(count).toBe(0)
  })
})
