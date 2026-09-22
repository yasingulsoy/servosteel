"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";

/**
 * E-posta metni editörü (Tiptap). Yalnızca e-postada işe yarayan biçimler:
 * kalın, italik, altı çizili, madde/numaralı liste, alıntı, bağlantı. Başlık,
 * görsel, renk, yazı tipi YOK — soğuk e-postada hem spam puanı hem "toplu
 * bülten" görüntüsü. Ürettiği HTML sunucuda ayrıca temizlenir (eposta-html.ts).
 *
 * `surum` değişince içerik `html`'e döner ("Hazır metne dön").
 */
export function EpostaEditoru({
  html,
  surum,
  kapali,
  degisince,
}: {
  html: string;
  surum: number;
  kapali: boolean;
  degisince: (html: string, metin: string) => void;
}) {
  const editor = useEditor({
    /* Sunucuda çizilmez — Next'te hidrasyon uyuşmazlığı olmasın */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"], defaultProtocol: "https" },
      }),
    ],
    content: html,
    editable: !kapali,
    editorProps: {
      attributes: {
        class:
          "eposta-editoru min-h-72 px-3 py-2.5 text-base leading-relaxed outline-none sm:text-sm [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-6",
        "aria-label": "E-posta metni",
      },
    },
    onUpdate: ({ editor: e }) => degisince(e.getHTML(), e.getText({ blockSeparator: "\n\n" })),
  });

  /* "Hazır metne dön": içerik baştan */
  useEffect(() => {
    if (!editor || surum === 0) return;
    editor.commands.setContent(html, { emitUpdate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca sürüm değişince
  }, [surum, editor]);

  /* false: "güncellendi" olayı çıkmasın — çıksaydı açılışta metin düzenlenmiş sayılırdı */
  useEffect(() => {
    editor?.setEditable(!kapali, false);
  }, [kapali, editor]);

  const durum = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            kalin: e.isActive("bold"),
            italik: e.isActive("italic"),
            alti: e.isActive("underline"),
            madde: e.isActive("bulletList"),
            numara: e.isActive("orderedList"),
            alinti: e.isActive("blockquote"),
            baglanti: e.isActive("link"),
            geri: e.can().undo(),
            ileri: e.can().redo(),
          }
        : null,
  });

  const dugme = (etkin: boolean | undefined, ad: string, is: () => void, ikon: React.ReactNode, pasif = false) => (
    <button
      type="button"
      title={ad}
      aria-label={ad}
      aria-pressed={etkin ? true : undefined}
      disabled={kapali || !editor || pasif}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        is();
      }}
      className={`grid size-8 place-items-center rounded-md text-ink hover:bg-surface-alt disabled:opacity-40 ${
        etkin ? "bg-surface-alt text-accent-ink ring-1 ring-line" : ""
      }`}
    >
      {ikon}
    </button>
  );

  const baglantiEkle = () => {
    if (!editor) return;
    const onceki = editor.getAttributes("link").href as string | undefined;
    const adres = window.prompt("Bağlantı adresi (https://…) — boş bırakılırsa bağlantı kaldırılır", onceki ?? "https://");
    if (adres === null) return;
    const temiz = adres.trim();
    if (!temiz || temiz === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:)/i.test(temiz)) {
      window.alert("Yalnızca https://, http:// ya da mailto: bağlantısı eklenebilir.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: temiz }).run();
  };

  const ik = "size-4";
  return (
    <div className="rounded-lg border border-line bg-card focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1" role="toolbar" aria-label="Biçim">
        {dugme(durum?.kalin, "Kalın", () => editor?.chain().focus().toggleBold().run(), <Bold className={ik} />)}
        {dugme(durum?.italik, "İtalik", () => editor?.chain().focus().toggleItalic().run(), <Italic className={ik} />)}
        {dugme(durum?.alti, "Altı çizili", () => editor?.chain().focus().toggleUnderline().run(), <Underline className={ik} />)}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        {dugme(durum?.madde, "Madde işaretli liste", () => editor?.chain().focus().toggleBulletList().run(), <List className={ik} />)}
        {dugme(durum?.numara, "Numaralı liste", () => editor?.chain().focus().toggleOrderedList().run(), <ListOrdered className={ik} />)}
        {dugme(durum?.alinti, "Alıntı", () => editor?.chain().focus().toggleBlockquote().run(), <Quote className={ik} />)}
        {dugme(durum?.baglanti, "Bağlantı", baglantiEkle, <Link2 className={ik} />)}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        {dugme(false, "Biçimi temizle", () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), <RemoveFormatting className={ik} />)}
        {dugme(false, "Geri al", () => editor?.chain().focus().undo().run(), <Undo2 className={ik} />, !durum?.geri)}
        {dugme(false, "Yinele", () => editor?.chain().focus().redo().run(), <Redo2 className={ik} />, !durum?.ileri)}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
