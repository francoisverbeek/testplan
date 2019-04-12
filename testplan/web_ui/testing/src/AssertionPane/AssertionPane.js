import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {css, StyleSheet} from 'aphrodite';
import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faMinusSquare,
  faPlusSquare,
} from '@fortawesome/free-solid-svg-icons';

import InfiniteScroll from './InfiniteScroll';
import AssertionGroup from "./AssertionGroup";

library.add(
  faPlusSquare,
  faMinusSquare
);

/**
 * Render the assertions of the selected test case.
 */
class AssertionPane extends Component {
  constructor(props) {
    super(props);

    this.state = {
      globalIsOpen: undefined,
      testcaseUid: undefined,
    };

    this.expandAllAssertions = this.expandAllAssertions.bind(this);
    this.collapseAllAssertions = this.collapseAllAssertions.bind(this);
    this.resetGlobalIsOpen = this.resetGlobalIsOpen.bind(this);
  }

  /**
   * Set the globalIsOpen state to true.
   */
  expandAllAssertions() {
    this.setState({globalIsOpen: true});
  }

  /**
   * Set the globalIsOpen state to false.
   */
  collapseAllAssertions() {
    this.setState({globalIsOpen: false});
  }

  /**
   * Set the globalIsOpen state to undefined.
   */
  resetGlobalIsOpen() {
    this.setState({globalIsOpen: undefined});
  }

  /**
   * Set the state on props change. This is needed to recognize that a different
   * test case is being rendered. The state of the expand all/collapse all 
   * variable is also reset.
   *
   * @param {object} props - Current props.
   * @param {object} state - Previous state.
   * @returns {object|null} - Return the new state if the test case changed or 
   * null otherwise.
   * @public
   */
  static getDerivedStateFromProps(props, state) {
    if (
      props.testcaseUid === undefined 
      || props.testcaseUid !== state.testcaseUid
    ) {
      return {testcaseUid: props.testcaseUid, globalIsOpen: undefined};
    }
    return null;
  }

  render() {
    let assertionPaneStyle = {
      position: 'absolute',
      left: `${this.props.left}em`,
      top: '5em',
      height: `calc(100% - 5em)`,
      width: `calc(100% - ${this.props.left}em)`,
    };

    if (this.props.assertions.length !== 0) {
      return (
        <div style={assertionPaneStyle}>
          <div className={css(styles.buttonsDiv)}>
            <FontAwesomeIcon
              size='2x'
              key='faPlusSquare'
              icon='plus-square'
              onClick={this.expandAllAssertions}
              className={css(styles.icon)}
            />
            <FontAwesomeIcon
              size='2x'
              key='faMinusSquare'
              icon='minus-square'
              onClick={this.collapseAllAssertions}
              className={css(styles.icon)}
            />
          </div>
          <div className={css(styles.infiniteScrollDiv)}>
            {/*
            The key is passed to force InfiniteScroll to update when only the
            props of AssertionPane are changed. Normally when just props change
            and not state the child component is not updated. Giving the
            InfiniteScroll component a key tells react to update it. Unsure if
            it updates it or creates a new instance, need to check.
            */}
            <InfiniteScroll
              key={this.props.testcaseUid}
              items={this.props.assertions}
            >
              <AssertionGroup
                entries={[]}
                globalIsOpen={this.state.globalIsOpen}
                resetGlobalIsOpen={this.resetGlobalIsOpen}
              />
            </InfiniteScroll>
          </div>
        </div>);
    } else {
      return null;
    }
  }
}

AssertionPane.propTypes = {
  /** List of assertions to be rendered */
  assertions: PropTypes.arrayOf(PropTypes.object),
  /** Unique identifier of the test case */
  testcaseUid: PropTypes.string,
  /** Left positional value */
  left: PropTypes.number,
};

const styles = StyleSheet.create({
  icon: {
    margin: '0rem .75rem 0rem 0rem',
    cursor: 'pointer',
  },

  buttonsDiv: {
    textAlign: 'right',
  },

  infiniteScrollDiv: {
    height: 'calc(100% - 35px)',
  }
});

export default AssertionPane;
