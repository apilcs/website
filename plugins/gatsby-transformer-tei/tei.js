const { JsonMlDoc } = require(`./jsonml`);

class TeiDoc extends JsonMlDoc {
  constructor(xmlString, debug) {
    super(xmlString, debug);

    this.footnotes = {};
    this.skipExprs = ["titlePart", "div[@type='articleBody']"];

    this.renderToHtml = {
      hi: (elem, attrs, doc) => {
        if (attrs.rend && attrs.rend === "italic")
          return `<em>${doc.toHtml([null, ...elem])}</em>`;

        if (attrs.rend && attrs.rend === "bold")
          return `<strong>${doc.toHtml([null, ...elem])}</strong>`;

        if (attrs.rend && attrs.rend === "sup")
          return `<sup>${doc.toHtml([null, ...elem])}</sup>`;

        if (this.debug)
          // eslint-disable-next-line no-console
          console.log(
            `passing through tag: ${this.constructor.renderTag(["hi", attrs])}`
          );

        return `<span>${doc.toHtml([null, ...elem])}</span>`;
      },

      p: (elem, attrs, doc) => {
        return `<p>${doc.toHtml([null, ...elem])}</p>`;
      },

      note: (elem, attrs, doc) => {
        const { n: footnoteIndex, "xml:id": footnoteId } = attrs;
        return `<sup id="${footnoteId}:ref"><a href="#${footnoteId}">${footnoteIndex}</a></sup>`;
      },

      placeName: (elem, attrs, doc) => {
        if (this.debug && Object.keys(attrs).length)
          // eslint-disable-next-line no-console
          console.warn(
            `Unexpected attrs: ${this.constructor.renderTag([
              "placeName",
              attrs
            ])}`
          );
        return `<span class="place-name">${doc.toHtml([null, ...elem])}</span>`;
      },

      div: (elem, attrs, doc) => {
        const { type } = attrs;
        if (type === "section")
          return `<section>${doc.toHtml([null, ...elem])}</section>`;

        if (this.debug)
          // eslint-disable-next-line no-console
          console.log(
            `passing through tag: ${this.constructor.renderTag(["div", attrs])}`
          );
        return doc.toHtml([null, ...elem]);
      },

      head: (elem, attrs, doc) => {
        if (this.debug && Object.keys(attrs).length)
          // eslint-disable-next-line no-console
          console.warn(
            `Unexpected attrs: ${this.constructor.renderTag(["head", attrs])}`
          );
        return `<header>${doc.toHtml([null, ...elem])}</header>`;
      }
    };

    // collect footnotes on class instantiation
    this.collectFootnotes();
  }

  collectFootnotes() {
    this.getElemsByName("note").forEach(_footnote => {
      const footnote = [..._footnote];
      footnote.shift();
      const attrs = footnote[0] instanceof Object ? footnote.shift() : {};
      const { n: footnoteIndex, "xml:id": footnoteId } = attrs;
      this.footnotes[footnoteId] = {
        index: footnoteIndex,
        content: this.toHtml([null, ...footnote])
      };
    });
  }

  getFrontmatter() {
    return {
      title: this.getFirstTextContent("titleStmt/title"),
      author: this.getFirstTextContent("titleStmt/author")
    };
  }

  getTitleHtml() {
    return TeiDoc.markupChinese(this.toHtml(this.getElemByPath("titlePart")));
  }

  getAbstractHtml() {
    return TeiDoc.markupChinese(
      this.toHtml(this.getElemByPath("div[@type='abstract']"))
    );
  }

  getKeywords() {
    // pass
  }

  getArticleBodyHtml() {
    return TeiDoc.markupChinese(
      this.toHtml(this.getElemByPath("div[@type='articleBody']"))
    );
  }

  getFootnotesHtml() {
    const footnotesHtml = Object.entries(this.footnotes)
      .map(
        ([id, footnote]) =>
          `<li id="${id}">${footnote.content}<a href="#${id}:ref">↩</a></li>`
      )
      .join("");
    return TeiDoc.markupChinese(`<ol>${footnotesHtml}</ol>`);
  }

  static markupChinese(text) {
    const chineseUnicodeRanges = [
      "[\u4e00-\u9fff]", // CJK Unified Ideographs
      "[\u3400-\u4dbf]", // CJK Unified Ideographs Extension A
      "[\u{20000}-\u{2a6df}]", // CJK Unified Ideographs Extension B
      "[\u{2a700}-\u{2b73f}]", // CJK Unified Ideographs Extension C
      "[\u{2b740}-\u{2b81f}]", // CJK Unified Ideographs Extension D
      "[\u{2b820}-\u{2ceaf}]", // CJK Unified Ideographs Extension E
      "[\u{2ceb0}-\u{2ebef}]", // CJK Unified Ideographs Extension F
      "[\uf900-\ufaff]", // CJK Compatibility Ideographs
      "[\u3300-\u33ff]", // CJK Compatibility
      "[\ufe30-\ufe4f]", // CJK Compatibility Forms
      "[\u{2f800}-\u{2fa1f}]" // CJK Compatibility Ideographs Supplement
    ];

    const anyChineseRegex = new RegExp(
      `(?<chinese>(?:${chineseUnicodeRanges.join("|")})+)`,
      "ug"
    );
    return text.replace(anyChineseRegex, '<span class="zh">$<chinese></span>');
  }
}

module.exports = { TeiDoc };
