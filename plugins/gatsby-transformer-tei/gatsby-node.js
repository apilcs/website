const { parseTei, getFrontmatter } = require(`./tei`);

async function onCreateNode({
  node,
  loadNodeContent,
  actions,
  createNodeId,
  reporter,
  createContentDigest
}) {
  const { createNode, createParentChildLink } = actions;

  if (node.internal.mediaType !== `application/xml`) {
    return {};
  }

  const content = await loadNodeContent(node);

  try {
    const teiDoc = parseTei(content);

    const teiNode = {
      id: createNodeId(`${node.id} >>> TEI`),
      children: [],
      parent: node.id,
      internal: {
        content,
        type: `TEI`
      }
    };

    teiNode.frontmatter = getFrontmatter(teiDoc);

    teiNode.rawXML = content;

    if (node.internal.type === `File`) {
      teiNode.fileAbsolutePath = node.absolutePath;
    }

    teiNode.internal.contentDigest = createContentDigest(teiNode);

    createNode(teiNode);
    createParentChildLink({ parent: node, child: teiNode });

    return teiNode;
  } catch (err) {
    reporter.panicOnBuild(
      `Error processing TEI file ${
        node.absolutePath ? `file ${node.absolutePath}` : `in node ${node.id}`
      }:\n
      ${err.message}`
    );

    return {};
  }
}

exports.onCreateNode = onCreateNode;