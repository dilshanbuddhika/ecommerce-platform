// ============================================
// ALERT COMPONENT
// ============================================
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const Alert = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-500',
      text: 'text-green-800',
      icon: <FiCheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      text: 'text-red-800',
      icon: <FiAlertCircle className="w-5 h-5 text-red-500" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      text: 'text-blue-800',
      icon: <FiInfo className="w-5 h-5 text-blue-500" />,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-500',
      text: 'text-yellow-800',
      icon: <FiAlertCircle className="w-5 h-5 text-yellow-500" />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`${style.bg} ${style.text} border-l-4 p-4 rounded-r-lg flex items-center justify-between animate-slideDown`}
    >
      <div className="flex items-center gap-3">
        {style.icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70">
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;