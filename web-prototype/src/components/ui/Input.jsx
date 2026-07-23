import styles from './Input.module.css'

export default function Input({
  label,
  id,
  error,
  helper,
  leftIcon,
  rightElement,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.group} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.inputWrap}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={id}
          className={`${styles.input} ${error ? styles.hasError : ''} ${leftIcon ? styles.withLeft : ''}`}
          {...props}
        />
        {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
      </div>
      {error  && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helperText}>{helper}</span>}
    </div>
  )
}
