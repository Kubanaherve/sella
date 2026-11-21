import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AccountStatusModal } from "@/components/AccountStatusModal";

interface AccountStatusContextType {
  openAccountStatusModal: (featureName?: string) => void;
  closeAccountStatusModal: () => void;
  isOpen: boolean;
  /**
   * Guards a user action. If the account has active write entitlements,
   * it executes the callback immediately. Otherwise, it triggers the
   * store-compliant AccountStatusModal.
   */
  requirePro: (action: () => void, featureName?: string) => void;
}

const AccountStatusContext = createContext<AccountStatusContextType | undefined>(
  undefined
);

export function AccountStatusProvider({ children }: { children: ReactNode }) {
  const { canWrite, mode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | undefined>(
    undefined
  );

  const openAccountStatusModal = useCallback((featureName?: string) => {
    setActiveFeature(featureName);
    setIsOpen(true);
  }, []);

  const closeAccountStatusModal = useCallback(() => {
    setIsOpen(false);
    setActiveFeature(undefined);
  }, []);

  const requirePro = useCallback(
    (action: () => void, featureName?: string) => {
      // In local mode or if write access is active, proceed
      if (mode === "local" || canWrite) {
        action();
        return;
      }

      // In cloud mode without active write entitlements, open status modal
      openAccountStatusModal(featureName);
    },
    [canWrite, mode, openAccountStatusModal]
  );

  return (
    <AccountStatusContext.Provider
      value={{
        openAccountStatusModal,
        closeAccountStatusModal,
        isOpen,
        requirePro,
      }}
    >
      {children}
      <AccountStatusModal
        open={isOpen}
        onClose={closeAccountStatusModal}
        featureName={activeFeature}
      />
    </AccountStatusContext.Provider>
  );
}

export function useAccountStatus() {
  const ctx = useContext(AccountStatusContext);
  if (!ctx) {
    throw new Error(
      "useAccountStatus must be used within an AccountStatusProvider"
    );
  }
  return ctx;
}
