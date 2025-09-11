export default {
  footer: <p>© {new Date().getFullYear()} NextRows Blog.</p>,
  head: ({ title, meta }: { title?: string; meta: Record<string, string> }) => (
    <>
      {meta?.description && (
        <meta name="description" content={meta.description} />
      )}
      {meta?.tag && <meta name="keywords" content={meta.tag} />}
      {meta?.author && <meta name="author" content={meta.author} />} 
      {title && <meta property="og:title" content={title} />}
    </>
  ),
  readMore: 'Read more →',
  postFooter: null,
  darkMode: true,
  navs: [
    { url: '/', name: 'Blog' },
    { url: '/contact', name: 'Contact' }
  ]
}
