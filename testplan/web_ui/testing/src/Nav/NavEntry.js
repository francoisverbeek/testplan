import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Badge} from 'reactstrap';
import {StyleSheet, css} from "aphrodite";

import {
  RED, 
  GREEN, 
  CATEGORY_ICONS, 
  ENTRY_TYPES, 
  STATUS 
} from "../Common/defaults";

/**
 * Display NavEntry information:
 *   * name.
 *   * case count (passed/failed).
 *   * type (displayed in badge).
 */
class NavEntry extends Component {
  render() {
    const { name, status, type, caseCountPassed, caseCountFailed } = this.props;
    const badgeStyle = `${status}Badge`;
    return (
      <div className='d-flex justify-content-between'>
        <div className={css(styles.entryName, styles[status])}>
          {name}
        </div>
        <div className={css(styles.entryIcons)}>
          <i className={css(styles.entryIcon)} title='passed/failed testcases'>
            <span className={css(styles.passed)}>{caseCountPassed}</span>
            /
            <span className={css(styles.failed)}>{caseCountFailed}</span>
          </i>
          <Badge
            className={css(styles.entryIcon, styles[badgeStyle])}
            title={type}
            pill>
            {CATEGORY_ICONS[type]}
          </Badge>
        </div>
      </div>
    );
  }
}

NavEntry.propTypes = {
  /** Entry name */
  name: PropTypes.string,
  /** Entry status */
  status: PropTypes.oneOf(STATUS),
  /** Entry type */
  type: PropTypes.oneOf(ENTRY_TYPES),
  /** Number of passing testcases entry has */
  caseCountPassed: PropTypes.number,
  /** Number of failing testcases entry has */
  caseCountFailed: PropTypes.number,
};

const styles = StyleSheet.create({
  entryName: {
    overflow: 'hidden',
    fontSize: '1em',
    fontWeight: 500,
  },
  entryIcons: {
    paddingLeft: '1em',
  },
  entryIcon: {
    fontSize: '0.6em',
    margin: '0em 0.5em 0em 0.5em',
  },
  passedBadge: {
    backgroundColor: GREEN,
    opacity: 0.5,
  },
  failedBadge: {
    backgroundColor: RED,
    opacity: 0.5,
  },
  passed: {
    color: GREEN,
  },
  failed: {
    color: RED,
  },
});

export default NavEntry;