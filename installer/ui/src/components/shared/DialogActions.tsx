import { Loader2, LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";

interface DialogActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText: string;
  confirmIcon?: LucideIcon;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function DialogActions({
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText,
  confirmIcon: ConfirmIcon,
  isLoading,
  loadingText = "Loading...",
  disabled,
  confirmVariant = "default",
}: DialogActionsProps) {
  return (
    <DialogFooter>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading || disabled}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {ConfirmIcon && <ConfirmIcon className="size-4" />}
            {confirmText}
          </>
        )}
      </Button>
    </DialogFooter>
  );
}

