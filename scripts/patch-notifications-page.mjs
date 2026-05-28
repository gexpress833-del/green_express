import fs from 'fs'

const path = 'frontend-next/app/notifications/page.jsx'
let s = fs.readFileSync(path, 'utf8')

const insert = `
  function openNotificationDetail(notification) {
    if (!notification.read_at) {
      handleMarkRead(notification)
    }
    setDetailNotification(notification)
  }

  function closeNotificationDetail() {
    setDetailNotification(null)
  }

  function navigateFromDetail(notification) {
    const href = resolveNotificationNavigateHref(notification, user?.role)
    closeNotificationDetail()
    if (href) router.push(href)
  }

`

const marker = '  function renderCard(notification) {'
if (!s.includes('function openNotificationDetail')) {
  s = s.replace(marker, insert + marker)
}

fs.writeFileSync(path, s, 'utf8')
console.log('patched')
