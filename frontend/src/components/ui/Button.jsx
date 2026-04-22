import './Button.css';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {loading && <Loader2 className="btn__spinner" size={16} />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="btn__icon" size={size === 'sm' ? 14 : 16} />
      )}
      <span className="btn__text">{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="btn__icon" size={size === 'sm' ? 14 : 16} />
      )}
    </motion.button>
  );
}
