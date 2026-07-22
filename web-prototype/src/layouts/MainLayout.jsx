import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/common/Sidebar'
import Topbar  from '@/components/common/Topbar'
import styles  from './MainLayout.module.css'

export default function MainLayout() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.content}>
        <Topbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
