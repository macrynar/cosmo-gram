"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

export type HistoryItem = {
  id: string;
  name: string;
  subtitle?: string;
};

type Props = {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onNew: () => void;
  newLabel?: string;
};

export default function HistorySelector({
  items, selectedId, onSelect, onDelete, onRename, onNew, newLabel = "Nowy",
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
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.name);
  }

  function commitRename() {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  }

  function cancelEdit() { setEditingId(null); }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarColor: "rgba(212,175,55,0.25) transparent" }}>
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const isEditing  = item.id === editingId;

        return (
          <div
            key={item.id}
            onClick={() => !isEditing && onSelect(item.id)}
            className="group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 cursor-pointer transition-all duration-300"
            style={isSelected ? {
              background: "rgba(212,175,55,0.14)",
              border: "0.5px solid rgba(212,175,55,0.45)",
              color: "#F3E5AB",
            } : {
              background: "rgba(212,175,55,0.04)",
              border: "0.5px solid rgba(212,175,55,0.15)",
              color: "#64748b",
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.35)";
                (e.currentTarget as HTMLElement).style.color = "#F3E5AB";
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#64748b";
              }
            }}
          >
            {isEditing ? (
              <>
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onClick={e => e.stopPropagation()}
                  className="bg-transparent outline-none w-32 text-white"
                />
                <button onClick={(e) => { e.stopPropagation(); commitRename(); }} className="text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="max-w-[140px] truncate">{item.name}</span>
                {item.subtitle && (
                  <span className="text-xs text-slate-600 hidden group-hover:inline">{item.subtitle}</span>
                )}
                <div className={`flex items-center gap-1 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                  <button
                    onClick={(e) => startEdit(item, e)}
                    className="text-slate-600 hover:text-amber-400 transition-colors p-0.5"
                    title="Zmień nazwę"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="text-slate-600 hover:text-red-400 transition-colors p-0.5"
                    title="Usuń"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 transition-all duration-300"
        style={{
          background: "transparent",
          border: "0.5px dashed rgba(212,175,55,0.22)",
          color: "#64748b",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.45)";
          (e.currentTarget as HTMLElement).style.color = "#F3E5AB";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.22)";
          (e.currentTarget as HTMLElement).style.color = "#64748b";
        }}
      >
        <Plus className="w-3.5 h-3.5" />
        {newLabel}
      </button>
    </div>
  );
}
