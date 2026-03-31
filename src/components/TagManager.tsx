import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdEdit } from "react-icons/md";

interface Props {
  channelId: string;
  autoTags: string[];
  getEffectiveTags: (channelId: string, autoTags: string[]) => string[];
  addUserTag: (channelId: string, tagName: string) => void;
  removeTag: (channelId: string, tagName: string, autoTags: string[]) => void;
  allUserTagNames: string[];
}

export function TagManager({
  channelId,
  autoTags,
  getEffectiveTags,
  addUserTag,
  removeTag,
  allUserTagNames,
}: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const datalistId = `tag-suggestions-${channelId}`;

  const effectiveTags = getEffectiveTags(channelId, autoTags);

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addUserTag(channelId, trimmed);
    setInputValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tags row with edit button */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {effectiveTags.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t("tags.noTagsYet")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {effectiveTags.map((tag) => {
                const isAuto = autoTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      isAuto
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    }`}
                  >
                    {tag}
                    {editing && (
                      <button
                        onClick={() => removeTag(channelId, tag, autoTags)}
                        className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                        aria-label={`Remove tag ${tag}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className={`flex-shrink-0 p-1 rounded-md transition-colors ${
            editing
              ? "text-red-500 bg-red-50 dark:bg-red-900/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label={editing ? t("tags.doneEditing") : t("tags.edit")}
          title={editing ? t("tags.doneEditing") : t("tags.edit")}
        >
          <MdEdit className="text-base" />
        </button>
      </div>

      {/* Add tag input — only shown in editing mode */}
      {editing && (
        <>
          <datalist id={datalistId}>
            {allUserTagNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              list={datalistId}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder={t("tags.inputPlaceholder")}
              className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 dark:focus:ring-red-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              onClick={handleAdd}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
            >
              {t("tags.add")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
