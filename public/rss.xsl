<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <style>
          body { font: 17px/1.6 system-ui, sans-serif; background: #0d0c0a; color: #e4ddcf; margin: 0; padding: 32px 16px; }
          main { max-width: 72ch; margin: 0 auto; }
          h1, h2, .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
          a { color: #f5b543; }
          .item { padding: 16px 0; border-top: 1px solid #2a2620; }
          .mono { color: #9d9380; font-size: 13px; }
          .note { background: #16140f; border: 1px solid #2a2620; padding: 12px 16px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <main>
          <p class="note">This is an RSS feed. Copy the address into a feed reader to subscribe.</p>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/> · <a><xsl:attribute name="href"><xsl:value-of select="/rss/channel/link"/></xsl:attribute>site</a></p>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <p class="mono"><xsl:value-of select="pubDate"/></p>
              <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
              <p><xsl:value-of select="description"/></p>
            </div>
          </xsl:for-each>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
