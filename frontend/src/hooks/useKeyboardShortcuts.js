import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useKeyboardShortcuts = (currentView, setCurrentView) => {
  const { info } = useToast();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+K or Cmd+K for search (future feature)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        info('Search feature coming soon!');
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
          const closeBtn = modal.querySelector('.modal-close') || modal.querySelector('[aria-label="Close"]');
          if (closeBtn) closeBtn.click();
        });
        return;
      }

      // Number keys for quick navigation (1-8)
      if (e.key >= '1' && e.key <= '8' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const views = ['dashboard', 'items', 'billing', 'analytics', 'sessions', 'inventory', 'customers', 'employees'];
        const index = parseInt(e.key) - 1;
        if (views[index] && currentView !== views[index]) {
          setCurrentView(views[index]);
          const viewNames = ['Dashboard', 'Items', 'Billing', 'Analytics', 'Sessions', 'Inventory', 'Customers', 'Employees'];
          info(`Switched to ${viewNames[index]}`);
        }
      }

      // F1 for help
      if (e.key === 'F1') {
        e.preventDefault();
        info('Keyboard Shortcuts: 1-8 = Navigation, Esc = Close modals, Ctrl+K = Search');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, setCurrentView, info]);
};


