import { Outlet } from 'react-router-dom'
import Navbar from '@/components/common/Navbar'
import Sidebar from '@/components/common/Sidebar'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.content}>
        <Navbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}