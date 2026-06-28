import styles from './Input.module.css'

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
}) {
  return (
    <div className={styles.group}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}