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
          body { font: 17px/1.6 system-ui, sans-serif; background: #0b0f14; color: #d7dee7; margin: 0; padding: 32px 16px; }
          main { max-width: 72ch; margin: 0 auto; }
          h1, h2, .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
          a { color: #5cf2a4; }
          .item { padding: 16px 0; border-top: 1px solid #1f2a36; }
          .mono { color: #8a97a6; font-size: 13px; }
          .note { background: #111821; border: 1px solid #1f2a36; padding: 12px 16px; border-radius: 4px; }
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
