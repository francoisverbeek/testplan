import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, Collapse} from 'reactstrap';
import {css, StyleSheet} from 'aphrodite';

import BasicAssertion from './AssertionTypes/BasicAssertion';
import TableLogAssertion
  from './AssertionTypes/TableAssertions/TableLogAssertion';
import TableMatchAssertion
  from './AssertionTypes/TableAssertions/TableMatchAssertion';
import ColumnContainAssertion
  from './AssertionTypes/TableAssertions/ColumnContainAssertion';
import DictLogAssertion from './AssertionTypes/DictAssertions/DictLogAssertion';
import FixLogAssertion from './AssertionTypes/DictAssertions/FixLogAssertion';
import DictMatchAssertion
  from './AssertionTypes/DictAssertions/DictMatchAssertion';
import FixMatchAssertion
  from './AssertionTypes/DictAssertions/FixMatchAssertion';
import NotImplementedAssertion from './AssertionTypes/NotImplementedAssertion';
import AssertionHeader from './AssertionHeader';
import AssertionGroup from './AssertionGroup';
import {BASIC_ASSERTION_TYPES} from '../Common/defaults';

/**
 * Component to render one assertion.
 */
class Assertion extends Component {
  constructor(props) {
    super(props);

    this.toggleAssertion = this.toggleAssertion.bind(this);
    this.state = {isOpen: this.props.assertion.passed === false};
  }

  shouldComponentUpdate(nextProps, nextState) {
    // If we used a PureComponent it would do a shallow prop comparison which
    // might suffice and we wouldn't need to include this.
    return (nextProps.assertion !== this.props.assertion) ||
      (nextProps.globalIsOpen !== this.props.globalIsOpen) ||
      (nextState.isOpen !== this.state.isOpen);
  }

  /**
   * Toggle the visibility of the assertion.
   * @public
   */
  toggleAssertion() {
    this.setState({isOpen: !this.state.isOpen});
    this.props.resetGlobalIsOpen();
  }

  /**
   * Set the state on props change. If expand all/collapse all buttons are
   * clicked, the assertion's state must be overwritten to the global state.
   *
   * @param {object} props - Current props.
   * @param {object} state - Previous state.
   * @returns {object|null} - Return the new state if the global state changed
   * or null otherwise.
   * @public
   */
  static getDerivedStateFromProps(props, state) {
    if (
      props.globalIsOpen !== undefined &&
      props.globalIsOpen !== state.isOpen
    ) {
      return {isOpen: props.globalIsOpen};
    }
    return null;
  }

  /**
   * Get the component object of the assertion.
   * @param {String} props - Assertion type props.
   * @returns {Object|null} - Return the assertion component class if the
   * assertion is implemented.
   * @public
   */
  assertionComponent(assertionType) {
    const assertionMap = {
      TableLog: TableLogAssertion,
      TableMatch: TableMatchAssertion,
      TableDiff: TableMatchAssertion,
      ColumnContain: ColumnContainAssertion,
      DictLog: DictLogAssertion,
      DictMatch: DictMatchAssertion,
      FixLog: FixLogAssertion,
      FixMatch: FixMatchAssertion,
    };
    if (assertionMap[assertionType]) {
      return assertionMap[assertionType];
    } else if (BASIC_ASSERTION_TYPES.indexOf(assertionType) >= 0) {
      return BasicAssertion;
    }
    return null;
  }

  render() {
    const isAssertionGroup = this.props.assertion.type === 'Group';
    let assertionType;

    if (isAssertionGroup) {
      assertionType = <AssertionGroup
        entries={this.props.assertion.entries}
        globalIsOpen={this.props.globalIsOpen}
        resetGlobalIsOpen={this.props.resetGlobalIsOpen}
      />;
    } else {
      let AssertionTypeComponent = this.assertionComponent(
        this.props.assertion.type);
      if (AssertionTypeComponent) {
        assertionType = 
          <AssertionTypeComponent assertion={this.props.assertion} />;
      } else {
        assertionType = <NotImplementedAssertion />;
      }
    }

    return (
      <Card className={css(styles.card)}>
        <AssertionHeader
          assertion={this.props.assertion}
          onClick={this.toggleAssertion}
          index={this.props.index}
        />
        <Collapse
          isOpen={this.state.isOpen}
          className={css(styles.collapseDiv)}
          style={{ paddingRight: isAssertionGroup ? null : '1.25rem' }}
        >
          <CardBody
            className={
              css(
                isAssertionGroup
                  ? styles.groupCardBody
                  : styles.assertionCardBody)
            }
          >
            {assertionType}
          </CardBody>
        </Collapse>
      </Card>
    );
  }
}

Assertion.propTypes = {
  /** Assertion to be rendered */
  assertion: PropTypes.object,
  /** State of the expand all/collapse all functionality */
  globalIsOpen: PropTypes.bool,
  /** Function to reset the expand all/collapse all state if an individual 
   * assertion's visibility is changed */
  resetGlobalIsOpen: PropTypes.func,
  /** Index of the assertion */
  index: PropTypes.number,
};

const styles = StyleSheet.create({
  assertionCardBody: {
    padding: '.5rem .75rem',
    fontSize: '13px',
    fontFamily: 'monospace',
  },

  groupCardBody: {
    padding: '0rem',
  },

  card: {
    margin: '.5rem 0rem .5rem .5rem',
    border: '0px',
  },

  collapseDiv: {
    paddingLeft: '1.25rem',
  }
});

export default Assertion;
