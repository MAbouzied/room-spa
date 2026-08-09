import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, $isListNode } from '@lexical/list';
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { $createNodeSelection, $createParagraphNode, $getNodeByKey, $getRoot, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND, DecoratorNode, type DOMConversionMap, type DOMConversionOutput, type EditorState, type LexicalEditor, type NodeKey, type SerializedLexicalNode } from 'lexical';
import type { AdminPost } from '../../lib/admin/blog-admin.ts';
import { ADMIN_EXCERPT_MAX, ADMIN_EXCERPT_MIN, ADMIN_TITLE_MAX, ADMIN_TITLE_MIN, shouldKeepExistingBlogSlug } from '../../lib/admin/blog-admin-helpers.ts';
import { createBlogSlug } from '../../modules/blog/lib/slug.ts';
import '../../modules/blog/styles/blog.css';

interface Props { post: AdminPost; services: Array<{ id: string; title: string }>; }
type Action = 'save' | 'publish' | 'preview' | 'cover' | 'inline' | null;

type ImageAlignment = 'left' | 'center' | 'right';
type ImageWidth = 25 | 50 | 75 | 100;
type SerializedBlogImageNode = SerializedLexicalNode & { type: 'blog-image'; src: string; alt: string; caption?: string; assetId?: string; align?: ImageAlignment; width?: ImageWidth; };
type SerializedBlogVideoNode = SerializedLexicalNode & { type: 'blog-video'; src: string; align?: ImageAlignment; width?: ImageWidth; };

function readImageDisplay(element: Element): { align: ImageAlignment; width: ImageWidth } {
  const widthValue = Number.parseFloat(element instanceof HTMLElement ? element.style.width : '');
  const width: ImageWidth = widthValue === 25 || widthValue === 50 || widthValue === 75 ? widthValue : 100;
  const marginInline = element instanceof HTMLElement ? element.style.marginInline : '';
  const align: ImageAlignment = marginInline === '0px auto' || marginInline === '0 auto' ? 'right' : marginInline === 'auto 0px' || marginInline === 'auto 0' ? 'left' : 'center';
  return { align, width };
}

function convertLegacyImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.tagName === 'FIGURE') {
    const image = domNode.querySelector('img');
    if (!image) return null;
    const src = image.getAttribute('src') || '';
    const alt = image.getAttribute('alt') || '';
    if (!src || !alt) return null;
    const caption = domNode.querySelector('figcaption')?.textContent?.trim() || '';
    const display = readImageDisplay(domNode);
    return { node: $createBlogImageNode(src, alt, caption, '', display.align, display.width) };
  }
  if (!(domNode instanceof HTMLImageElement)) return null;
  if (domNode.closest('figure')) return null;
  const src = domNode.getAttribute('src') || '';
  const alt = domNode.getAttribute('alt') || '';
  if (!src || !alt) return null;
  const display = readImageDisplay(domNode);
  return { node: $createBlogImageNode(src, alt, '', '', display.align, display.width) };
}

class BlogImageNode extends DecoratorNode<ReactNode> {
  __src: string; __alt: string; __caption: string; __assetId: string; __align: ImageAlignment; __width: ImageWidth;
  static getType(): string { return 'blog-image'; }
  static clone(node: BlogImageNode): BlogImageNode { return new BlogImageNode(node.__src, node.__alt, node.__caption, node.__assetId, node.__align, node.__width, node.__key); }
  static importJSON(serialized: SerializedBlogImageNode): BlogImageNode { return new BlogImageNode(serialized.src, serialized.alt, serialized.caption || '', serialized.assetId || '', serialized.align, serialized.width); }
  static importDOM(): DOMConversionMap | null {
    return {
      figure: () => ({ conversion: convertLegacyImageElement, priority: 2 }),
      img: () => ({ conversion: convertLegacyImageElement, priority: 2 }),
    };
  }
  constructor(src: string, alt: string, caption = '', assetId = '', align: ImageAlignment = 'center', width: ImageWidth = 100, key?: NodeKey) { super(key); this.__src = src; this.__alt = alt; this.__caption = caption; this.__assetId = assetId; this.__align = align === 'left' || align === 'right' ? align : 'center'; this.__width = width === 25 || width === 50 || width === 75 ? width : 100; }
  exportJSON(): SerializedBlogImageNode { return { type: 'blog-image', version: 1, src: this.__src, alt: this.__alt, ...(this.__caption ? { caption: this.__caption } : {}), ...(this.__assetId ? { assetId: this.__assetId } : {}), ...(this.__align !== 'center' ? { align: this.__align } : {}), ...(this.__width !== 100 ? { width: this.__width } : {}) }; }
  setDisplay(align: ImageAlignment, width: ImageWidth): void { const writable = this.getWritable(); writable.__align = align; writable.__width = width; }
  getDisplay(): { align: ImageAlignment; width: ImageWidth } { return { align: this.__align, width: this.__width }; }
  createDOM(): HTMLElement { const figure = document.createElement('figure'); figure.className = 'editor-inline-image'; return figure; }
  updateDOM(): false { return false; }
  decorate(): ReactNode { return <BlogImageDecorator nodeKey={this.__key} src={this.__src} alt={this.__alt} caption={this.__caption} align={this.__align} width={this.__width} />; }
}

function BlogImageDecorator({ nodeKey, src, alt, caption, align, width }: { nodeKey: NodeKey; src: string; alt: string; caption: string; align: ImageAlignment; width: ImageWidth }) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected] = useState(false);

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const selection = $getSelection();
      setSelected($isNodeSelection(selection) && selection.has(nodeKey));
    });
  }), [editor, nodeKey]);

  const selectImage = () => editor.update(() => {
    const selection = $createNodeSelection();
    selection.add(nodeKey);
    $setSelection(selection);
  });
  const updateDisplay = (nextAlign: ImageAlignment, nextWidth: ImageWidth) => editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (node instanceof BlogImageNode) node.setDisplay(nextAlign, nextWidth);
  });
  const removeImage = () => editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (node instanceof BlogImageNode) node.remove();
  });
  const marginInline = align === 'center' ? 'auto' : align === 'right' ? '0 auto' : 'auto 0';

  return <figure
    className={`editor-inline-image${selected ? ' is-selected' : ''}`}
    style={{ width: `${width}%`, marginInline }}
    onClick={(event) => { event.stopPropagation(); selectImage(); }}
  >
    <img src={src} alt={alt} loading="lazy" />
    {caption ? <figcaption>{caption}</figcaption> : null}
    {selected ? <div className="editor-image-tools" role="toolbar" aria-label="خيارات الصورة" onMouseDown={(event) => event.preventDefault()} onClick={(event) => event.stopPropagation()}>
      <span className="editor-image-tools-label">محاذاة</span>
      <button type="button" aria-label="محاذاة لليمين" aria-pressed={align === 'right'} onClick={() => updateDisplay('right', width)}>يمين</button>
      <button type="button" aria-label="محاذاة للوسط" aria-pressed={align === 'center'} onClick={() => updateDisplay('center', width)}>وسط</button>
      <button type="button" aria-label="محاذاة لليسار" aria-pressed={align === 'left'} onClick={() => updateDisplay('left', width)}>يسار</button>
      <span className="editor-image-tools-label">الحجم</span>
      {[25, 50, 75, 100].map((nextWidth) => <button key={nextWidth} type="button" aria-label={`عرض ${nextWidth}%`} aria-pressed={width === nextWidth} onClick={() => updateDisplay(align, nextWidth as ImageWidth)}>{nextWidth}%</button>)}
      <button type="button" className="editor-image-remove" onClick={removeImage}>حذف الصورة</button>
    </div> : null}
  </figure>;
}

function $createBlogImageNode(src: string, alt: string, caption = '', assetId = '', align: ImageAlignment = 'center', width: ImageWidth = 100): BlogImageNode { return new BlogImageNode(src, alt, caption, assetId, align, width); }
class BlogVideoNode extends DecoratorNode<ReactNode> {
  __src: string; __align: ImageAlignment; __width: ImageWidth;
  static getType(): string { return 'blog-video'; }
  static clone(node: BlogVideoNode): BlogVideoNode { return new BlogVideoNode(node.__src, node.__align, node.__width, node.__key); }
  static importJSON(serialized: SerializedBlogVideoNode): BlogVideoNode { return new BlogVideoNode(serialized.src, serialized.align, serialized.width); }
  constructor(src: string, align: ImageAlignment = 'center', width: ImageWidth = 100, key?: NodeKey) { super(key); this.__src = src; this.__align = align === 'left' || align === 'right' ? align : 'center'; this.__width = width === 25 || width === 50 || width === 75 ? width : 100; }
  exportJSON(): SerializedBlogVideoNode { return { type: 'blog-video', version: 1, src: this.__src, ...(this.__align !== 'center' ? { align: this.__align } : {}), ...(this.__width !== 100 ? { width: this.__width } : {}) }; }
  setDisplay(align: ImageAlignment, width: ImageWidth): void { const writable = this.getWritable(); writable.__align = align; writable.__width = width; }
  createDOM(): HTMLElement { const figure = document.createElement('figure'); figure.className = 'editor-inline-video'; return figure; }
  updateDOM(): false { return false; }
  decorate(): ReactNode { return <BlogVideoDecorator nodeKey={this.__key} src={this.__src} align={this.__align} width={this.__width} />; }
}

function BlogVideoDecorator({ nodeKey, src, align, width }: { nodeKey: NodeKey; src: string; align: ImageAlignment; width: ImageWidth }) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected] = useState(false);

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const selection = $getSelection();
      setSelected($isNodeSelection(selection) && selection.has(nodeKey));
    });
  }), [editor, nodeKey]);

  const selectVideo = () => editor.update(() => {
    const selection = $createNodeSelection();
    selection.add(nodeKey);
    $setSelection(selection);
  });
  const updateDisplay = (nextAlign: ImageAlignment, nextWidth: ImageWidth) => editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (node instanceof BlogVideoNode) node.setDisplay(nextAlign, nextWidth);
  });
  const removeVideo = () => editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (node instanceof BlogVideoNode) node.remove();
  });
  const marginInline = align === 'center' ? 'auto' : align === 'right' ? '0 auto' : 'auto 0';

  return <figure className={`editor-inline-video${selected ? ' is-selected' : ''}`} style={{ width: `${width}%`, marginInline }}>
    <div className="editor-video-frame">
      <iframe src={src} title="فيديو المقال" loading="lazy" allowFullScreen />
      <button type="button" className="editor-video-select-overlay" aria-label="تحديد الفيديو لتعديل خصائصه" onClick={(event) => { event.stopPropagation(); selectVideo(); }} />
    </div>
    {selected ? <div className="editor-image-tools editor-video-tools" role="toolbar" aria-label="خيارات الفيديو" onMouseDown={(event) => event.preventDefault()} onClick={(event) => event.stopPropagation()}>
      <span className="editor-image-tools-label">محاذاة</span>
      <button type="button" aria-label="محاذاة لليمين" aria-pressed={align === 'right'} onClick={() => updateDisplay('right', width)}>يمين</button>
      <button type="button" aria-label="محاذاة للوسط" aria-pressed={align === 'center'} onClick={() => updateDisplay('center', width)}>وسط</button>
      <button type="button" aria-label="محاذاة لليسار" aria-pressed={align === 'left'} onClick={() => updateDisplay('left', width)}>يسار</button>
      <span className="editor-image-tools-label">الحجم</span>
      {[25, 50, 75, 100].map((nextWidth) => <button key={nextWidth} type="button" aria-label={`عرض ${nextWidth}%`} aria-pressed={width === nextWidth} onClick={() => updateDisplay(align, nextWidth as ImageWidth)}>{nextWidth}%</button>)}
      <button type="button" className="editor-image-remove" onClick={removeVideo}>حذف الفيديو</button>
    </div> : null}
  </figure>;
}

function Spinner() { return <span className="action-spinner" aria-hidden="true" />; }

function InitialContentPlugin({ json, html }: { json: string; html: string }) {
  const [editor] = useLexicalComposerContext();
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (json) {
      try { editor.setEditorState(editor.parseEditorState(json)); return; } catch { /* fall through to legacy HTML */ }
    }
    if (!html) return;
    editor.update(() => {
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().clear().append(...nodes);
    }, { tag: 'initial-load' });
  }, [editor, html, json]);
  return null;
}

function EditorBridge({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => onReady(editor), [editor, onReady]);
  return null;
}

function Toolbar({ onImage, onVideo, disabled }: { onImage: () => void; onVideo: () => void; disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState({ block: 'p', bold: false, italic: false, underline: false, strike: false, link: false });
  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchor = selection.anchor.getNode();
      const topLevel = anchor.getKey() === 'root' ? anchor : anchor.getTopLevelElementOrThrow();
      let block = 'p';
      if ($isHeadingNode(topLevel)) block = topLevel.getTag();
      else if ($isQuoteNode(topLevel)) block = 'quote';
      else if ($isListNode(topLevel)) block = topLevel.getListType() === 'number' ? 'ol' : 'ul';
      let current = anchor;
      let link = false;
      while (current) {
        if ($isLinkNode(current)) { link = true; break; }
        const parent = current.getParent();
        if (!parent) break;
        current = parent;
      }
      setActive({ block, bold: selection.hasFormat('bold'), italic: selection.hasFormat('italic'), underline: selection.hasFormat('underline'), strike: selection.hasFormat('strikethrough'), link });
    });
  }), [editor]);
  const block = (tag: 'h2' | 'h3' | 'p' | 'quote') => editor.update(() => { const selection = $getSelection(); if (!$isRangeSelection(selection)) return; $setBlocksType(selection, () => tag === 'p' ? $createParagraphNode() : tag === 'quote' ? new QuoteNode() : $createHeadingNode(tag)); });
  const link = () => { const url = window.prompt('أدخل الرابط'); if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url); };
  return <div className="rich-toolbar" role="toolbar" aria-label="تنسيق النص">
    <button type="button" aria-label="تراجع" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={disabled}>↶</button><button type="button" aria-label="إعادة" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={disabled}>↷</button><span className="toolbar-sep" aria-hidden="true" />
    <button type="button" aria-label="فقرة" aria-pressed={active.block === 'p'} onClick={() => block('p')} disabled={disabled}>نص</button><button type="button" aria-label="عنوان فرعي" aria-pressed={active.block === 'h2'} onClick={() => block('h2')} disabled={disabled}>H2</button><button type="button" aria-label="عنوان أصغر" aria-pressed={active.block === 'h3'} onClick={() => block('h3')} disabled={disabled}>H3</button><button type="button" aria-label="اقتباس" aria-pressed={active.block === 'quote'} onClick={() => block('quote')} disabled={disabled}>❝ اقتباس</button><span className="toolbar-sep" aria-hidden="true" />
    <button type="button" aria-label="عريض" aria-pressed={active.bold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} disabled={disabled}><strong>B</strong></button><button type="button" aria-label="مائل" aria-pressed={active.italic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} disabled={disabled}><em>I</em></button><button type="button" aria-label="تسطير" aria-pressed={active.underline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} disabled={disabled}><u>U</u></button><button type="button" aria-label="يتوسطه خط" aria-pressed={active.strike} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')} disabled={disabled}><s>S</s></button><span className="toolbar-sep" aria-hidden="true" />
    <button type="button" aria-label="قائمة نقطية" aria-pressed={active.block === 'ul'} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} disabled={disabled}>• قائمة</button><button type="button" aria-label="قائمة رقمية" aria-pressed={active.block === 'ol'} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} disabled={disabled}>1. قائمة</button><span className="toolbar-sep" aria-hidden="true" />
    <button type="button" aria-label="إدراج رابط" aria-pressed={active.link} onClick={link} disabled={disabled}>رابط</button><button type="button" aria-label="إدراج صورة" onClick={onImage} disabled={disabled}>صورة</button><button type="button" aria-label="إدراج فيديو" onClick={onVideo} disabled={disabled}>فيديو</button>
  </div>;
}

function EditorField({ post, onChange, onImage, onVideo, onReady, disabled }: { post: AdminPost; onChange: (state: EditorState, html: string) => void; onImage: () => void; onVideo: () => void; onReady: (editor: LexicalEditor) => void; disabled: boolean }) {
  const initialConfig = useMemo(() => ({
    namespace: 'RoomSpaBlog',
    theme: {
      paragraph: 'editor-paragraph',
      quote: 'editor-quote',
      heading: { h2: 'editor-heading-h2', h3: 'editor-heading-h3' },
      list: { ol: 'editor-list-ol', ul: 'editor-list-ul', listitem: 'editor-listitem' },
      link: 'editor-link',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
        strikethrough: 'editor-text-strikethrough',
      },
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, BlogImageNode, BlogVideoNode],
    onError(error: Error) { throw error; },
  }), []);
  return <LexicalComposer initialConfig={initialConfig}>
    <div className="content-field blog-root" dir="rtl" lang="ar">
      <div className="field-heading"><label>محتوى المقال</label><span>استخدم الأدوات لتنسيق النص</span></div>
      <Toolbar onImage={onImage} onVideo={onVideo} disabled={disabled} />
      <div className="content-editor lexical-editor blog-body" dir="rtl" lang="ar">
        <RichTextPlugin contentEditable={<ContentEditable className="lexical-content" dir="rtl" lang="ar" aria-label="محتوى المقال" />} placeholder={<div className="lexical-placeholder">ابدأ كتابة المقال هنا…</div>} ErrorBoundary={LexicalErrorBoundary} />
      </div>
      <HistoryPlugin /><ListPlugin /><LinkPlugin />
      <InitialContentPlugin json={post.contentJson} html={post.contentHtml} />
      <EditorBridge onReady={onReady} />
      <OnChangePlugin onChange={(state, editor) => { editor.read(() => onChange(state, $generateHtmlFromNodes(editor, null))); }} ignoreSelectionChange />
    </div>
  </LexicalComposer>;
}

function apiError(result: unknown, fallback: string): Error {
  if (!result || typeof result !== 'object' || !('error' in result)) return new Error(fallback);
  const error = (result as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return new Error(message);
  }
  return new Error(fallback);
}

export default function BlogEditorApp({ post, services }: Props) {
  const [fields, setFields] = useState({ title: post.title, slug: post.slug, excerpt: post.excerpt, category: post.category || 'عام', author: post.author || 'فريق روم سبا', coverUrl: post.coverUrl, coverAlt: post.coverAlt, coverAssetId: post.coverAssetId, relatedServiceId: post.relatedServiceId });
  const [featured, setFeatured] = useState(post.featured);
  const [content, setContent] = useState({ json: post.contentJson, html: post.contentHtml });
  const [slugManual, setSlugManual] = useState(() => shouldKeepExistingBlogSlug(post.slug));
  const [action, setAction] = useState<Action>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [coverPreview, setCoverPreview] = useState(post.coverUrl);
  const [coverError, setCoverError] = useState('');
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineMode, setInlineMode] = useState<'device' | 'url'>('device');
  const [inlineFile, setInlineFile] = useState<File | null>(null);
  const [inlineUrl, setInlineUrl] = useState('');
  const [inlineAlt, setInlineAlt] = useState('');
  const [inlineCaption, setInlineCaption] = useState('');
  const [inlineError, setInlineError] = useState('');
  const editorRef = useRef<LexicalEditor | null>(null);

  useEffect(() => { const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); (event as unknown as { returnValue: string }).returnValue = ''; } }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [dirty]);
  const notify = (text: string, error = false) => { setMessage({ text, error }); window.setTimeout(() => setMessage(null), 5000); };
  const updateField = (name: keyof typeof fields, value: string) => { setFields((current) => ({ ...current, [name]: value })); setDirty(true); };
  const onTitle = (value: string) => { setFields((current) => ({ ...current, title: value, ...(slugManual ? {} : { slug: createBlogSlug(value) }) })); setDirty(true); };
  const editorHydrated = useRef(false);
  async function request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch(`/api/admin/blog/${path}`, { ...options, headers });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
      throw apiError(result, 'تعذر تنفيذ العملية');
    }
    return result;
  }
  function payload() { return { ...fields, featured, contentJson: content.json, contentHtml: content.html }; }
  async function save(mode: 'save' | 'publish' | 'preview') {
    if (action) return;
    if (mode !== 'save') {
      const titleLength = Array.from(fields.title.trim()).length;
      const excerptLength = Array.from(fields.excerpt.trim()).length;
      if (titleLength < ADMIN_TITLE_MIN || titleLength > ADMIN_TITLE_MAX) {
        notify(`عنوان المقال يجب أن يكون بين ${ADMIN_TITLE_MIN} و ${ADMIN_TITLE_MAX} حرفاً.`, true);
        return;
      }
      if (excerptLength < ADMIN_EXCERPT_MIN || excerptLength > ADMIN_EXCERPT_MAX) {
        notify(`مقدمة المقال يجب أن تكون بين ${ADMIN_EXCERPT_MIN} و ${ADMIN_EXCERPT_MAX} حرفاً.`, true);
        return;
      }
      if (!fields.slug.trim()) { notify('أدخل رابطاً مختصراً صالحاً قبل النشر.', true); return; }
    }
    setAction(mode); setMessage(null);
    try {
      const saved = await request(`posts/${encodeURIComponent(post.id)}`, { method: 'PUT', body: JSON.stringify(payload()) }) as AdminPost;
      setFields((current) => ({ ...current, slug: saved.slug || current.slug }));
      if (mode === 'publish') await request(`posts/${encodeURIComponent(post.id)}/publish`, { method: 'POST' });
      setDirty(false);
      if (mode === 'preview') window.location.assign(`/admin/${encodeURIComponent(post.id)}/preview`); else notify(mode === 'publish' ? 'تم نشر المقال بنجاح.' : 'تم حفظ المسودة بنجاح.');
    } catch (error) { notify(error instanceof Error ? error.message : 'تعذر حفظ المقال.', true); } finally { setAction(null); }
  }
  async function uploadCover(file: File) {
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setCoverError('اختر صورة حتى 10 ميجابايت.'); return; }
    setAction('cover'); setCoverError('');
    try { const formData = new FormData(); formData.append('file', file, file.name); formData.append('alt', fields.coverAlt || file.name); const result = await request('assets', { method: 'POST', body: formData }) as { assetId: string; url: string }; setFields((current) => ({ ...current, coverUrl: result.url, coverAssetId: result.assetId, coverAlt: current.coverAlt || file.name.replace(/\.[^.]+$/, '') })); setCoverPreview(result.url); setDirty(true); notify('تم رفع الصورة الرئيسية.'); } catch (error) { setCoverError(error instanceof Error ? error.message : 'تعذر رفع الصورة.'); } finally { setAction(null); }
  }
  async function insertInlineImage() {
    if (!inlineAlt.trim() || action) { setInlineError('أدخل الوصف البديل للصورة.'); return; }
    setAction('inline'); setInlineError('');
    try {
      let uploaded: { assetId: string; url: string };
      if (inlineMode === 'device') {
        if (!inlineFile) throw new Error('اختر صورة من جهازك أولاً.');
        if (!inlineFile.type.startsWith('image/') || inlineFile.size > 10 * 1024 * 1024) throw new Error('اختر صورة حتى 10 ميجابايت.');
        const formData = new FormData(); formData.append('file', inlineFile, inlineFile.name); uploaded = await request('assets', { method: 'POST', body: formData });
      } else { uploaded = await request('assets/import', { method: 'POST', body: JSON.stringify({ url: inlineUrl }) }); }
      const editor = editorRef.current;
      if (!editor) throw new Error('تعذر تجهيز محرر الصور.');
      editor.focus();
      editor.update(() => {
        const node = $createBlogImageNode(uploaded.url, inlineAlt.trim(), inlineCaption.trim(), uploaded.assetId);
        const selection = $getSelection();
        if ($isRangeSelection(selection)) selection.insertNodes([node]); else $getRoot().append(node);
      });
      setInlineOpen(false); setInlineFile(null); setInlineUrl(''); setInlineAlt(''); setInlineCaption(''); setDirty(true);
    } catch (error) { setInlineError(error instanceof Error ? error.message : 'تعذر إضافة الصورة.'); } finally { setAction(null); }
  }
  function openImageDialog() { setInlineOpen(true); setInlineError(''); }
  function addVideo() { const raw = window.prompt('رابط فيديو YouTube أو Vimeo'); if (!raw) return; try { const parsed = new URL(raw); const embed = parsed.hostname.includes('youtu.be') ? `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}` : parsed.hostname.includes('youtube.com') ? `https://www.youtube-nocookie.com/embed/${parsed.searchParams.get('v') || parsed.pathname.split('/').pop()}` : parsed.hostname.includes('vimeo.com') ? `https://player.vimeo.com/video/${parsed.pathname.split('/').filter(Boolean).pop()}` : ''; if (!embed) throw new Error(); const editor = editorRef.current; if (!editor) throw new Error(); editor.update(() => { const selection = $getSelection(); const node = new BlogVideoNode(embed); if ($isRangeSelection(selection)) selection.insertNodes([node]); else $getRoot().append(node); }); setDirty(true); } catch { notify('أدخل رابط فيديو صالحاً من YouTube أو Vimeo.', true); } }

  return <section className="editor-view" dir="rtl">
    <div className="editor-topbar"><a className="text-button" href="/admin">← العودة للمقالات</a><span>{post.title ? 'تحرير المقال' : 'مقال جديد'}</span></div>
    {message ? <div className={`admin-status${message.error ? ' error' : ''}`} role="status" aria-live="polite">{message.text}</div> : null}
    <form className="post-form" onSubmit={(event) => event.preventDefault()}>
      <div className="editor-grid"><div className="editor-column">
        <label>عنوان المقال<input value={fields.title} onChange={(e) => onTitle(e.target.value)} required minLength={ADMIN_TITLE_MIN} maxLength={ADMIN_TITLE_MAX} placeholder="اكتب عنواناً واضحاً" /></label>
        <label>الرابط المختصر<input value={fields.slug} onChange={(e) => { setSlugManual(Boolean(e.target.value.trim())); updateField('slug', e.target.value); }} maxLength={96} placeholder="يُنشأ تلقائياً من العنوان" aria-describedby="slug-help" /><small id="slug-help" className="field-help">يمكنك تعديله يدوياً، ويقبل الأحرف العربية.</small></label>
        <label>المقدمة<textarea value={fields.excerpt} onChange={(e) => updateField('excerpt', e.target.value)} required minLength={ADMIN_EXCERPT_MIN} maxLength={ADMIN_EXCERPT_MAX} rows={3} placeholder="ملخص قصير يظهر في بطاقات المدونة" /></label>
        <EditorField post={post} disabled={Boolean(action)} onImage={openImageDialog} onVideo={addVideo} onReady={(editor) => { editorRef.current = editor; window.setTimeout(() => { editorHydrated.current = true; }, 0); }} onChange={(state, html) => { setContent({ json: JSON.stringify(state.toJSON()), html }); if (editorHydrated.current) setDirty(true); }} />
      </div><aside className="editor-side">
        <div className="side-card"><h2>النشر</h2><label>الكاتب<input value={fields.author} onChange={(e) => updateField('author', e.target.value)} /></label><label className="check-row"><input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); setDirty(true); }} /> مقال مميز</label><div className="side-actions"><button type="button" className="button button-secondary" disabled={Boolean(action)} onClick={() => save('save')}>{action === 'save' ? <><Spinner /> جارٍ حفظ المسودة…</> : 'حفظ كمسودة'}</button><button type="button" className="button button-primary" disabled={Boolean(action)} onClick={() => save('publish')}>{action === 'publish' ? <><Spinner /> جارٍ النشر…</> : 'نشر المقال'}</button></div></div>
        <div className="side-card image-card"><h2>الصورة الرئيسية</h2><label className="file-upload-label">رفع صورة من جهازك<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadCover(file); }} /><span className="file-upload-control"><span>اختيار صورة</span><small>PNG أو JPG أو WEBP حتى 10MB</small></span></label>{action === 'cover' ? <div className="image-upload-status"><Spinner /> جارٍ رفع الصورة…</div> : null}{coverError ? <div className="image-upload-status error">{coverError}</div> : null}{coverPreview ? <img className="image-upload-preview" src={coverPreview} alt={fields.coverAlt || fields.title} /> : null}<label>رابط الصورة<input value={fields.coverUrl} onChange={(e) => { updateField('coverUrl', e.target.value); setFields((current) => ({ ...current, coverAssetId: '' })); setCoverPreview(e.target.value); }} placeholder="https://… أو /assets/…" /></label><label>الوصف البديل<input value={fields.coverAlt} onChange={(e) => updateField('coverAlt', e.target.value)} placeholder="وصف الصورة" /></label></div>
        <div className="side-card"><h2>خدمة مرتبطة <span>(اختياري)</span></h2><select value={fields.relatedServiceId} onChange={(e) => updateField('relatedServiceId', e.target.value)}><option value="">بدون خدمة مرتبطة</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select></div>
        <button type="button" className="button button-preview" disabled={Boolean(action)} onClick={() => save('preview')}>{action === 'preview' ? <><Spinner /> جارٍ تجهيز المعاينة…</> : 'معاينة المقال'}</button>
      </aside></div>
    </form>
    {inlineOpen ? <div className="editor-modal-backdrop" role="presentation"><div className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="inline-image-title"><h2 id="inline-image-title">إضافة صورة داخل المقال</h2><div className="modal-tabs"><button type="button" className={inlineMode === 'device' ? 'is-active' : ''} onClick={() => setInlineMode('device')}>من الجهاز</button><button type="button" className={inlineMode === 'url' ? 'is-active' : ''} onClick={() => setInlineMode('url')}>من رابط</button></div>{inlineMode === 'device' ? <label key="inline-device">اختر صورة<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setInlineFile(e.target.files?.[0] || null)} /></label> : <label key="inline-url">رابط الصورة<input value={inlineUrl} onChange={(e) => setInlineUrl(e.target.value)} placeholder="https://…" /></label>}<label>الوصف البديل<input value={inlineAlt} onChange={(e) => setInlineAlt(e.target.value)} required /></label><label>تعليق اختياري<input value={inlineCaption} onChange={(e) => setInlineCaption(e.target.value)} /></label>{inlineError ? <div className="image-upload-status error">{inlineError}</div> : null}<div className="modal-actions"><button type="button" className="button button-secondary" disabled={action === 'inline'} onClick={() => setInlineOpen(false)}>إلغاء</button><button type="button" className="button button-primary" disabled={action === 'inline'} onClick={insertInlineImage}>{action === 'inline' ? <><Spinner /> جارٍ رفع الصورة…</> : 'إضافة الصورة'}</button></div></div></div> : null}
  </section>;
}
