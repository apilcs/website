import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Parser from "html-react-parser";
import { injectIntl } from "gatsby-plugin-intl"; // Link, FormattedMessage
import { intlShape } from "react-intl";

import Layout from "../components/layout";
import Meta from "../components/meta";

export const query = graphql`
  query {
    tei {
      frontmatter {
        author
        title
      }
    }
  }
`;

const StaticPage = ({ data }) => {
  const { tei } = data;
  const { title, author } = tei.frontmatter;

  return (
    <Layout>
      <Meta title={title} />
      <h1>{title}</h1>
      <h3>{author}</h3>
    </Layout>
  );
};

StaticPage.propTypes = {
  data: PropTypes.shape({ tei: PropTypes.object.isRequired }).isRequired
};

export default injectIntl(StaticPage);