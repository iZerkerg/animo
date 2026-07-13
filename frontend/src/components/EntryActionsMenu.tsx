import { EllipsisVertical } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MoodEntry } from "../services/api";

export type EntryAction = "edit" | "delete";

type Props = {
  entry: MoodEntry;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (action: EntryAction, entry: MoodEntry) => void;
};

type MenuPosition = { left: number; top: number };

const viewportMargin = 8;
const menuGap = 6;

export function EntryActionsMenu({ entry, isOpen, onClose, onOpen, onSelect }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuId = `entry-actions-${entry.id}`;

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const buttonRect = button.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const left = Math.min(
        Math.max(viewportMargin, buttonRect.right - menuWidth),
        window.innerWidth - menuWidth - viewportMargin
      );
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const top = spaceBelow >= menuHeight + menuGap + viewportMargin
        ? buttonRect.bottom + menuGap
        : Math.max(viewportMargin, buttonRect.top - menuHeight - menuGap);

      setPosition({ left, top });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !position || menuRef.current?.contains(document.activeElement)) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [isOpen, position]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function selectAction(action: EntryAction) {
    onClose();
    onSelect(action, entry);
    buttonRef.current?.focus();
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Home") items[0]?.focus();
    else if (event.key === "End") items.at(-1)?.focus();
    else if (event.key === "ArrowDown") items[(currentIndex + 1) % items.length]?.focus();
    else items[(currentIndex - 1 + items.length) % items.length]?.focus();
  }

  const menu = isOpen ? createPortal(
    <div
      aria-label="Acciones del registro"
      className="entry-actions-popover"
      id={menuId}
      onKeyDown={handleMenuKeyDown}
      ref={menuRef}
      role="menu"
      style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }}
    >
      <button role="menuitem" type="button" onClick={() => selectAction("edit")}>
        <span aria-hidden="true">✏️</span> Editar registro
      </button>
      <button role="menuitem" type="button" onClick={() => selectAction("delete")}>
        <span aria-hidden="true">🗑️</span> Eliminar registro
      </button>
    </div>,
    document.body
  ) : null;

  return <>
    <button
      aria-controls={isOpen ? menuId : undefined}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label="Opciones del registro"
      className="entry-actions-trigger"
      onClick={() => isOpen ? onClose() : onOpen()}
      ref={buttonRef}
      type="button"
    >
      <EllipsisVertical aria-hidden="true" size={20} />
    </button>
    {menu}
  </>;
}
