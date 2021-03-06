// @flow

/* eslint jsx-a11y/no-static-element-interactions: 0 */

import React from "react";
import CommonMark from "commonmark";
import MarkdownRenderer from "commonmark-react-renderer";

import LatexRenderer from "./latex";

import { Outputs, PromptBuffer, Input } from "./";

type Props = {
  source: string,
  focusAbove: () => void,
  focusBelow: () => void,
  focusEditor: Function,
  cellFocused: boolean,
  editorFocused: boolean,
  children: React$Element<*>
};

type State = {
  view: boolean
};

// TODO: Standardize this as @nteract/markdown-renderer
//       and keep it consistent amongst the markdown transform and in the
//       rendered view of markdown cells
type MDRender = (input: string) => string;
const parser = new CommonMark.Parser();
const renderer = new MarkdownRenderer();
const mdRender: MDRender = input => renderer.render(parser.parse(input));

// TODO: Consider whether this component is really something like two components:
//
//       * a behavioral component that tracks focus (possibly already covered elsewhere)
//       * the actual markdown previewer
//
//       Since I'm really unsure and don't want to write a silly abstraction that
//       only I (@rgbkrk) understand, I'll wait for others to reflect on this
//       within the code base (or leave it alone, which is totally cool too). :)

export default class MarkdownCell extends React.PureComponent<any, State> {
  rendered: ?HTMLElement;

  static defaultProps = {
    cellFocused: false,
    editorFocused: false,
    focusAbove: () => {},
    focusBelow: () => {},
    focusEditor: () => {},
    source: ""
  };

  constructor(props: Props): void {
    super(props);
    this.state = {
      view: true
    };
    (this: any).openEditor = this.openEditor.bind(this);
    (this: any).editorKeyDown = this.editorKeyDown.bind(this);
    (this: any).renderedKeyDown = this.renderedKeyDown.bind(this);
  }

  componentDidMount(): void {
    this.updateFocus();
  }

  componentWillReceiveProps(nextProps: Props): void {
    this.setState({
      view: !nextProps.editorFocused
    });
  }

  componentDidUpdate(): void {
    this.updateFocus();
  }

  updateFocus(): void {
    if (
      this.rendered &&
      this.state &&
      this.state.view &&
      this.props.cellFocused
    ) {
      this.rendered.focus();
      if (this.props.editorFocused) {
        this.openEditor();
      }
    }
  }

  /**
   * Handles when a keydown event occurs on the unrendered MD cell
   */
  editorKeyDown(e: SyntheticKeyboardEvent<*>): void {
    // TODO: ctrl-enter will set the state view mode, _however_
    //       the focus is still set from above the editor
    //       Suggestion: we need a `this.props.unfocusEditor`
    //       It's either that or we should be setting `view` from
    //       the outside
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;
    if ((shift || ctrl) && e.key === "Enter") {
      this.setState({ view: true });
    }
  }

  openEditor(): void {
    this.setState({ view: false });
    this.props.focusEditor();
  }

  /**
   * Handles when a keydown event occurs on the rendered MD cell
   */
  renderedKeyDown(e: SyntheticKeyboardEvent<*>): boolean {
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;
    if ((shift || ctrl) && e.key === "Enter") {
      this.setState({ view: true });
      return false;
    }

    switch (e.key) {
      case "ArrowUp":
        this.props.focusAbove();
        break;
      case "ArrowDown":
        this.props.focusBelow();
        break;
      case "Enter":
        this.openEditor();
        e.preventDefault();
        return false;
      default:
    }
    return true;
  }

  render(): ?React$Element<any> {
    const source = this.props.source;

    return this.state && this.state.view ? (
      <div
        onDoubleClick={this.openEditor}
        onKeyDown={this.renderedKeyDown}
        ref={rendered => {
          this.rendered = rendered;
        }}
      >
        <Outputs>
          <LatexRenderer>
            {mdRender(
              source
                ? source
                : "*Empty markdown cell, double click me to add content.*"
            )}
          </LatexRenderer>
        </Outputs>
      </div>
    ) : (
      <div onKeyDown={this.editorKeyDown}>
        <Input>
          <PromptBuffer />
          {/* The editor */}
          {this.props.children}
        </Input>
        <Outputs hidden={source === ""}>
          <LatexRenderer>{mdRender(source)}</LatexRenderer>
        </Outputs>
      </div>
    );
  }
}
