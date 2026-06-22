"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { SIGN_TO_KEY } from "@/components/astro/zodiacGlyphs";

export type HistoryItem = {
  id: string;
  name: string;
  subtitle?: string;
  /** Polish sign name (e.g. "Wodnik") or sign key (e.g. "aquarius") — used for portrait */
  sunSign?: string;
};

type Props = {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onSetPrimary?: (id: string) => void;
  primaryId?: string | null;
  onNew: () => void;
  newLabel?: string;
};

function portraitPath(sunSign?: string): string {
  if (!sunSign) return "/assets/zodiac/sign-aries.png";
  const key = SIGN_TO_KEY[sunSign] ?? sunSign;
  return `/assets/zodiac/sign-${key}.png`;
}

export default function HistorySelector({
  items, selectedId, onSelect, onDelete, onRename, onSetPrimary, primaryId, onNew, newLabel = "Nowy",
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startEdit(item: HistoryItem, e: React.MouseEvent) {
    if (!onRename) return;
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.name);
  }

  function commitRename() {
    if (editingId && editValue.trim() && onRename) onRename(editingId, editValue.trim());
    setEditingId(null);
  }

  function cancelEdit() { setEditingId(null); }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const isEditing  = item.id === editingId;
        const isPrimary  = item.id === primaryId;

        return (
          <div
            key={item.id}
            onClick={() => !isEditing && onSelect(item.id)}
            className="group flex items-center gap-2.5 px-3 py-2 rounded-2xl whitespace-nowrap shrink-0 cursor-pointer transition-all duration-300"
            style={isSelected ? {
              background: "rgba(224,181,102,0.10)",
              border:     "0.5px solid rgba(224,181,102,0.45)",
              boxShadow:  "0 0 18px rgba(224,181,102,0.08)",
            } : {
              background: "rgba(224,181,102,0.03)",
              border:     "0.5px solid rgba(224,181,102,0.12)",
            }}
            onMouseEnter={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(224,181,102,0.32)";
            }}
            onMouseLeave={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(224,181,102,0.12)";
            }}
          >
            {/* Portrait thumbnail */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: 40, height: 40, borderRadius: 10, border: "0.5px solid rgba(224,181,102,0.22)" }}
            >
              <Image
                src={portraitPath(item.sunSign)}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                onError={() => {}}
              />
            </div>

            {/* Name + subtitle */}
            <div className="flex flex-col min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="bg-transparent outline-none w-28 text-sm"
                    style={{ color: "#E9DCC0" }}
                  />
                  <button onClick={commitRename} className="text-amber-400 hover:text-amber-300 p-0.5">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: isSelected ? "#E9DCC0" : "#A09BBF" }}
                  >
                    {isPrimary && (
                      <Star className="w-3 h-3 shrink-0" style={{ color: "#E0B566", fill: "#E0B566" }} aria-label="Główny" />
                    )}
                    <span className="truncate max-w-[110px]">{item.name}</span>
                  </span>
                  {item.subtitle && (
                    <span className="text-xs truncate max-w-[120px]" style={{ color: "rgba(135,127,160,0.65)" }}>
                      {item.subtitle}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Edit / Delete — appear on hover or selection */}
            {!isEditing && (
              <div
                className={`flex items-center gap-0.5 ml-0.5 transition-opacity duration-200 ${
                  isSelected ? "opacity-70" : "opacity-0 group-hover:opacity-60"
                }`}
              >
                {onSetPrimary && !isPrimary && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetPrimary(item.id); }}
                    className="hover:text-amber-400 transition-colors p-1"
                    style={{ color: "#4B5563" }}
                    title="Ustaw jako główny"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                {onRename && (
                  <button
                    onClick={(e) => startEdit(item, e)}
                    className="hover:text-amber-400 transition-colors p-1"
                    style={{ color: "#4B5563" }}
                    title="Zmień nazwę"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="hover:text-red-400 transition-colors p-1"
                  style={{ color: "#4B5563" }}
                  title="Usuń"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new pill */}
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm whitespace-nowrap shrink-0 transition-all duration-300"
        style={{
          height:     56,
          background: "transparent",
          border:     "0.5px dashed rgba(224,181,102,0.22)",
          color:      "#877FA0",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(224,181,102,0.45)";
          (e.currentTarget as HTMLElement).style.color       = "#E9DCC0";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(224,181,102,0.22)";
          (e.currentTarget as HTMLElement).style.color       = "#877FA0";
        }}
      >
        <Plus className="w-3.5 h-3.5" />
        {newLabel}
      </button>
    </div>
  );
}
