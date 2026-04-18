import './Button.css';
import { Loader2 } from 'lucide-react';

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
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="btn__spinner" size={16} />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="btn__icon" size={size === 'sm' ? 14 : 16} />
      )}
      <span className="btn__text">{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="btn__icon" size={size === 'sm' ? 14 : 16} />
      )}
    </button>
  );
}
