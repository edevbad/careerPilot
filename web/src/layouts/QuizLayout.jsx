import { Outlet } from 'react-router-dom'
import styles from './QuizLayout.module.css'

export default function QuizLayout() {
  return (
    <div className={styles.wrapper}>
      <Outlet />
    </div>
  )
}